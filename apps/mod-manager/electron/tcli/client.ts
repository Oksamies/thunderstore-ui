import { ChildProcess, spawn } from "child_process";
import * as readline from "readline";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class TcliClient {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<
    number | string,
    { resolve: (val: any) => void; reject: (err: any) => void }
  >();
  private rl: readline.Interface | null = null;

  constructor(
    private executablePath: string,
    private workingDirectory: string
  ) {}

  public async start() {
    if (this.process) return;

    console.log(`Starting tcli server from ${this.executablePath}`);
    this.process = spawn(this.executablePath, ["server"], {
      cwd: this.workingDirectory,
      stdio: ["pipe", "pipe", "inherit"], // stdin, stdout, stderr
    });

    if (!this.process.stdout) {
      throw new Error("Failed to capture stdout of tcli process");
    }

    this.rl = readline.createInterface({
      input: this.process.stdout,
      terminal: false,
    });

    this.rl.on("line", (line) => {
      if (!line.trim()) return;
      try {
        const response: JsonRpcResponse = JSON.parse(line);
        this.handleResponse(response);
      } catch (e) {
        console.error("Failed to parse tcli response:", line, e);
      }
    });

    this.process.on("exit", (code) => {
      console.log(`tcli process exited with code ${code}`);
      this.process = null;
      this.rl?.close();
      // Reject all pending requests
      for (const { reject } of this.pendingRequests.values()) {
        reject(new Error("tcli process exited unexpectedly"));
      }
      this.pendingRequests.clear();
    });
  }

  public async stop(): Promise<void> {
    if (this.process) {
      return new Promise((resolve) => {
        if (!this.process) {
          resolve();
          return;
        }
        this.process.once("exit", () => {
          // Default listener handles cleanup
          resolve();
        });
        this.process.kill();
      });
    }
  }

  private handleResponse(response: JsonRpcResponse) {
    const { id, result, error } = response;
    if (id === undefined || id === null) return; // Notification?

    const pending = this.pendingRequests.get(id);
    if (pending) {
      this.pendingRequests.delete(id);
      if (error) {
        pending.reject(new Error(error.message));
      } else {
        pending.resolve(result);
      }
    }
  }

  private async send<T>(method: string, params?: any): Promise<T> {
    if (!this.process || !this.process.stdin) {
      throw new Error("tcli server is not running");
    }

    const id = ++this.requestId;
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      const data = JSON.stringify(request) + "\n";
      this.process!.stdin!.write(data, (err) => {
        if (err) {
          this.pendingRequests.delete(id);
          reject(err);
        }
      });
    });
  }

  // Wrapped Methods

  public async openProject(path: string): Promise<{ path: string }> {
    return this.send("project/open", { path });
  }

  public async getProjectMetadata(): Promise<{
    statefile_path: string;
    manifest_path: string;
    lockfile_path: string;
  }> {
    return this.send("project/get_metadata");
  }

  public async addPackages(packages: string[]): Promise<{ added: number }> {
    return this.send("project/add_packages", { packages });
  }

  public async removePackages(
    packages: string[]
  ): Promise<{ removed: number }> {
    return this.send("project/remove_packages", { packages });
  }

  public async installedPackages(): Promise<any[]> {
    return this.send("project/installed_packages");
  }
}
