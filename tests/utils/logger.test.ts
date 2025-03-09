import { Logger } from "../../src/utils/logger";

describe("Logger", () => {
  let logger: Logger;
  let consoleSpy: {
    debug: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    logger = new Logger({ namespace: "test" });
    consoleSpy = {
      debug: jest.spyOn(console, "debug").mockImplementation(() => {}),
      info: jest.spyOn(console, "info").mockImplementation(() => {}),
      warn: jest.spyOn(console, "warn").mockImplementation(() => {}),
      error: jest.spyOn(console, "error").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    test("should create instance with default settings", () => {
      const defaultLogger = new Logger({ namespace: "default" });
      expect(defaultLogger).toBeDefined();
    });

    test("should create instance with debug disabled in production", () => {
      const prodLogger = new Logger({
        namespace: "prod",
        debug: false,
      });

      prodLogger.debug("test");
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    test("should throw on empty namespace", () => {
      expect(() => new Logger({ namespace: "" })).toThrow(
        "Namespace cannot be empty"
      );
    });

    test("should handle undefined debug setting", () => {
      const defaultLogger = new Logger({ namespace: "test" });
      defaultLogger.debug("test");
      expect(consoleSpy.debug).toHaveBeenCalled();
    });
  });

  describe("logging methods", () => {
    test("should log debug messages when enabled", () => {
      logger.debug("test message");
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG] [test] test message")
      );
    });

    test("should log info messages", () => {
      logger.info("test message");
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] [test] test message")
      );
    });

    test("should log warning messages", () => {
      logger.warn("test message");
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARN] [test] test message")
      );
    });

    test("should log error messages", () => {
      logger.error("test message");
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR] [test] test message")
      );
    });

    test("should handle undefined messages", () => {
      logger.info(undefined as any);
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining("[undefined]")
      );
    });

    test("should include context in log messages", () => {
      const context = { key: "value", number: 42 };
      logger.info("test message", context);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(context))
      );
    });

    test("should handle undefined context", () => {
      logger.info("test message", undefined);
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.not.stringContaining("undefined")
      );
    });

    test("should handle circular references in context", () => {
      const circular: any = { key: "value" };
      circular.self = circular;

      logger.info("test message", circular);
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining("[Circular]")
      );
    });

    test("should handle non-object context", () => {
      logger.info("test message", 42 as any);
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining("42")
      );
    });

    test("should handle complex nested objects", () => {
      const nested = {
        a: { b: { c: 1 } },
        d: [1, 2, { e: 3 }],
      };
      logger.info("test message", nested);
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(nested))
      );
    });
  });

  describe("memory logging", () => {
    test("should log memory usage info", () => {
      logger.memory("Memory check");
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] [test] Memory check")
      );
    });

    test("should log memory usage with default message", () => {
      logger.memory();
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] [test] Memory usage")
      );
    });

    test("should handle memory usage errors", () => {
      jest.spyOn(process, "memoryUsage").mockImplementation(() => {
        throw new Error("Memory error");
      });

      logger.memory();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to get memory usage")
      );
    });

    test("should include memory stats", () => {
      const memoryStats = {
        heapTotal: 100,
        heapUsed: 50,
        external: 0,
        arrayBuffers: 0,
        rss: 200,
        buffers: 0,
      } as NodeJS.MemoryUsage;

      jest.spyOn(process, "memoryUsage").mockReturnValue(memoryStats);

      logger.memory();

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"heapUsed":50')
      );
    });

    test("should handle missing memory values", () => {
      const partialStats = {
        heapTotal: 100,
        heapUsed: 50,
      } as any;

      jest.spyOn(process, "memoryUsage").mockReturnValue(partialStats);

      logger.memory();
      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });

  describe("static methods", () => {
    test("should get singleton instance", () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();

      expect(instance1).toBe(instance2);
    });

    test("should create new instance with custom namespace", () => {
      const logger = new Logger({ namespace: "custom" });
      expect(logger).toBeDefined();

      logger.info("test");
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining("[custom]")
      );
    });

    test("should support multiple instances with different namespaces", () => {
      const logger1 = new Logger({ namespace: "one" });
      const logger2 = new Logger({ namespace: "two" });

      logger1.info("test1");
      logger2.info("test2");

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining("[one]")
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining("[two]")
      );
    });
  });

  describe("error handling", () => {
    test("should handle JSON.stringify errors", () => {
      const badObj = {
        get bad() {
          throw new Error("Bad property");
        },
      };

      logger.info("test", badObj);
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining("[Complex object]")
      );
    });

    test("should handle console method errors", () => {
      const error = new Error("Console error");
      consoleSpy.info.mockImplementation(() => {
        throw error;
      });

      expect(() => logger.info("test")).not.toThrow();
    });
  });
});
