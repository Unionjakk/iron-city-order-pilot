
export interface LogEntry {
  message: string;
  timestamp: number;
}

export class LocationSyncLogger {
  private static formatLogEntry(message: string): LogEntry {
    return {
      message,
      timestamp: Date.now()
    };
  }

  static logConnection(message: string, addToLogs: (message: string) => void) {
    console.log(`[Connection]: ${message}`);
    addToLogs(message);
  }

  static logRequest(message: string, addToLogs: (message: string) => void) {
    console.log(`[Request]: ${message}`);
    addToLogs(message);
  }

  static logResponse(message: string, addToLogs: (message: string) => void) {
    console.log(`[Response]: ${message}`);
    addToLogs(message);
  }

  static logDatabase(message: string, addToLogs: (message: string) => void) {
    console.log(`[Database]: ${message}`);
    addToLogs(message);
  }
}
