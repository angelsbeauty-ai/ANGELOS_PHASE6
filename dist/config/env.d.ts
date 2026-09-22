export type AngelosEnvironment = 'development' | 'test' | 'staging' | 'production';
export interface RuntimeConfig {
    environment: AngelosEnvironment;
    port: number;
    corsOrigins: string[];
    trustProxyHops: number;
}
export declare function validateRuntimeEnvironment(): RuntimeConfig;
