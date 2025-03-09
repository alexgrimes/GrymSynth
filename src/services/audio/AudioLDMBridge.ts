import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import os from "os";
import { Logger } from "../../utils/logger";
import { AudioGenerationResult } from "./AudioLDMService";

export interface AudioLDMBridgeConfig {
  modelPath: string;
  quantization: "8bit" | "4bit" | "none";
  diffusionSteps: number;
  useHalfPrecision: boolean;
  offloadModules: string[];
  pythonPath?: string;
}

export class AudioLDMBridge {
  private pythonPath: string;
  private scriptPath: string;
  private logger: Logger;
  private initialized: boolean = false;

  constructor(private config: AudioLDMBridgeConfig) {
    this.logger = new Logger({ namespace: "audioldm-bridge" });
    this.pythonPath = config.pythonPath || "python";
    this.scriptPath = path.join(
      __dirname,
      "../../../scripts/audioldm_operations.py"
    );
  }

  async initialize(): Promise<void> {
    try {
      // Check if the script exists
      if (!fs.existsSync(this.scriptPath)) {
        throw new Error(`AudioLDM script not found at ${this.scriptPath}`);
      }

      // Test Python environment
      await this.executeCommand("test-env", {});

      // Preload model to verify it works
      await this.executeCommand("load-model", {
        model_path: this.config.modelPath,
        quantization: this.config.quantization,
        use_half_precision: this.config.useHalfPrecision,
      });

      this.initialized = true;
    } catch (error) {
      this.logger.error("Failed to initialize AudioLDM bridge", { error });
      throw error;
    }
  }

  async generateAudio(
    prompt: string,
    params: Record<string, any>
  ): Promise<AudioGenerationResult> {
    if (!this.initialized) {
      throw new Error("AudioLDM bridge not initialized");
    }

    try {
      // Create a temporary directory for outputs
      const requestId = uuidv4();
      const outputDir = path.join(os.tmpdir(), `audioldm_${requestId}`);
      fs.mkdirSync(outputDir, { recursive: true });

      // Execute generation command
      const result = await this.executeCommand("generate", {
        prompt,
        output_dir: outputDir,
        output_name: `audio_${requestId}`,
        steps: params.steps,
        guidance_scale: params.guidanceScale,
        batch_size: params.batchSize,
        duration: params.duration,
        sample_rate: params.sampleRate,
      });

      // Read the generated audio file
      const outputPath = path.join(outputDir, `audio_${requestId}.wav`);
      if (!fs.existsSync(outputPath)) {
        throw new Error("Generated audio file not found");
      }

      // Convert to Float32Array
      const audioBuffer = await this.readAudioFile(outputPath);

      // Clean up temp files
      this.cleanupTempFiles(outputDir);

      return {
        audio: audioBuffer.audio,
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        parameters: {
          prompt,
          steps: params.steps,
          guidanceScale: params.guidanceScale,
          ...params,
        },
      };
    } catch (error) {
      this.logger.error("Error generating audio", { error, prompt });
      throw error;
    }
  }

  private async executeCommand(
    operation: string,
    params: Record<string, any>
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Create command with parameters
      const args = [
        this.scriptPath,
        "--operation",
        operation,
        "--request-id",
        uuidv4(),
      ];

      // Add parameters as JSON
      args.push("--params", JSON.stringify(params));

      // Spawn Python process
      const pythonProcess = spawn(this.pythonPath, args);

      let result = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
        // Log stderr but don't consider it an error yet (could be just warnings)
        this.logger.debug("Python stderr output", { output: data.toString() });
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(`Python process exited with code ${code}: ${errorOutput}`)
          );
          return;
        }

        try {
          // Extract JSON result from stdout (handle potential non-JSON output)
          const jsonMatch = result.match(/({[\s\S]*})/);
          if (!jsonMatch) {
            reject(new Error(`Failed to parse JSON result: ${result}`));
            return;
          }

          const parsedResult = JSON.parse(jsonMatch[1]);
          if (parsedResult.error) {
            reject(new Error(parsedResult.error));
            return;
          }

          resolve(parsedResult);
        } catch (error) {
          reject(
            new Error(
              `Failed to parse result: ${
                error instanceof Error ? error.message : String(error)
              }`
            )
          );
        }
      });
    });
  }

  private async readAudioFile(
    filePath: string
  ): Promise<{ audio: Float32Array; sampleRate: number; duration: number }> {
    // Use another Python command to read the audio file and return raw data
    // This avoids direct dependencies on audio libraries in Node
    const result = await this.executeCommand("read-audio", {
      file_path: filePath,
    });

    // Convert base64 audio data to Float32Array
    const buffer = Buffer.from(result.audio_data, "base64");
    const audio = new Float32Array(new Float32Array(buffer.buffer));

    return {
      audio,
      sampleRate: result.sample_rate,
      duration: result.duration,
    };
  }

  private cleanupTempFiles(directory: string): void {
    try {
      // Recursively remove all files in the directory
      if (fs.existsSync(directory)) {
        const files = fs.readdirSync(directory);
        for (const file of files) {
          const filePath = path.join(directory, file);
          fs.unlinkSync(filePath);
        }
        fs.rmdirSync(directory);
      }
    } catch (error) {
      this.logger.warn("Failed to clean up temporary files", {
        directory,
        error,
      });
    }
  }

  async dispose(): Promise<void> {
    // No persistent process to dispose, but signal we're no longer initialized
    this.initialized = false;
  }
}
