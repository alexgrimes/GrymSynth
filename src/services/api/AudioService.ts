import { apiRequest } from "../../services/api/api-client";
import {
  AudioFile,
  AudioPattern,
  AudioPatternBase,
  AudioProcessingOptions,
  AudioAnalysisResult,
  ProcessingProgress,
} from "../../services/api/types";
import {
  SpectralRegion,
  SpectrogramData,
} from "../../components/visualization/types";

class AudioService {
  private static instance: AudioService;

  private constructor() {}

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  async uploadAudio(file: File): Promise<AudioFile> {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest.post<AudioFile>("/audio/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async getAudioFile(id: string): Promise<AudioFile> {
    return apiRequest.get<AudioFile>(`/audio/${id}`);
  }

  async listAudioFiles(
    page = 1,
    limit = 10
  ): Promise<{ items: AudioFile[]; total: number }> {
    return apiRequest.get<{ items: AudioFile[]; total: number }>("/audio", {
      params: { page, limit },
    });
  }

  async deleteAudio(id: string): Promise<void> {
    return apiRequest.delete<void>(`/audio/${id}`);
  }

  async analyzeAudio(
    id: string,
    options: AudioProcessingOptions = {}
  ): Promise<AudioAnalysisResult> {
    return apiRequest.post<AudioAnalysisResult>(
      `/audio/${id}/analyze`,
      options
    );
  }

  async getPatterns(audioId: string): Promise<SpectralRegion[]> {
    const response = await apiRequest.get<AudioPattern[]>(
      `/audio/${audioId}/patterns`
    );
    return response.map((pattern) => this.patternToRegion(pattern));
  }

  async savePattern(
    audioId: string,
    pattern: SpectralRegion
  ): Promise<SpectralRegion> {
    const request: AudioPatternBase = {
      ...this.regionToPattern(pattern, audioId),
      audioFileId: audioId,
    };
    const savedPattern = await apiRequest.post<AudioPattern>(
      `/audio/${audioId}/patterns`,
      request
    );
    return this.patternToRegion(savedPattern);
  }

  async updatePattern(
    audioId: string,
    patternId: string,
    updates: Partial<SpectralRegion>
  ): Promise<SpectralRegion> {
    const request: Partial<AudioPatternBase> = {
      ...this.regionToPattern(updates as SpectralRegion, audioId),
      audioFileId: audioId,
    };
    const updatedPattern = await apiRequest.patch<AudioPattern>(
      `/audio/${audioId}/patterns/${patternId}`,
      request
    );
    return this.patternToRegion(updatedPattern);
  }

  async deletePattern(audioId: string, patternId: string): Promise<void> {
    return apiRequest.delete<void>(`/audio/${audioId}/patterns/${patternId}`);
  }

  async generateAudio(
    prompt: string,
    options: {
      duration?: number;
      style?: string;
      tempo?: number;
      customParameters?: Record<string, any>;
    } = {}
  ): Promise<AudioFile> {
    return apiRequest.post<AudioFile>("/audio/generate", {
      prompt,
      ...options,
    });
  }

  async processAudio(
    id: string,
    operations: Array<{
      type: string;
      parameters: Record<string, any>;
    }>
  ): Promise<AudioFile> {
    return apiRequest.post<AudioFile>(`/audio/${id}/process`, { operations });
  }

  async getProcessingStatus(processingId: string): Promise<ProcessingProgress> {
    return apiRequest.get<ProcessingProgress>(`/processing/${processingId}`);
  }

  async getSpectrogramData(
    audioId: string,
    options: {
      minFrequency?: number;
      maxFrequency?: number;
      resolution?: number;
      showPatterns?: boolean;
      timeRange?: [number, number];
    } = {}
  ): Promise<SpectrogramData> {
    return apiRequest.get<SpectrogramData>(`/audio/${audioId}/spectrogram`, {
      params: {
        minFreq: options.minFrequency,
        maxFreq: options.maxFrequency,
        resolution: options.resolution,
        showPatterns: options.showPatterns,
        startTime: options.timeRange?.[0],
        endTime: options.timeRange?.[1],
      },
    });
  }

  // Convert AudioPattern to SpectralRegion for UI components
  private patternToRegion(pattern: AudioPattern): SpectralRegion {
    return {
      startTime: pattern.startTime,
      endTime: pattern.endTime,
      lowFreq: pattern.lowFreq,
      highFreq: pattern.highFreq,
      confidence: pattern.confidence,
      patternId: pattern.id,
      label: pattern.label,
    };
  }

  // Convert SpectralRegion to AudioPatternBase for API
  private regionToPattern(
    region: SpectralRegion,
    audioId: string
  ): AudioPatternBase {
    return {
      startTime: region.startTime,
      endTime: region.endTime,
      lowFreq: region.lowFreq,
      highFreq: region.highFreq,
      confidence: region.confidence,
      label: region.label,
      audioFileId: audioId,
      metadata: {},
    };
  }
}

export default AudioService.getInstance();
