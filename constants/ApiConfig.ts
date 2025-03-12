type EnvConfig = {
    API_BASE: string;
    TIMEOUT: number;
};

// 开发环境配置
const devConfig: EnvConfig = {
    API_BASE: "http://192.168.111.30:3000",
    TIMEOUT: 15000
};

// 生产环境配置
const prodConfig: EnvConfig = {
    API_BASE: "http://192.168.111.30:3000",
    TIMEOUT: 10000
};


// export const config = DEV ? devConfig : prodConfig;

export const config = devConfig;