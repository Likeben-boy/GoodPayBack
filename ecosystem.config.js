module.exports = {
  apps: [{
    name: 'goodpayback',
    script: 'dist/index.js',           // 运行编译后的JS文件
    instances: 'max',                   // 利用所有CPU核心
    exec_mode: 'cluster',               // 集群模式
    autorestart: true,                  // 自动重启
    watch: false,                       // 生产环境不监听文件变化
    max_memory_restart: '1G',           // 内存超过1GB时重启
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',       // 错误日志
    out_file: './logs/out.log',         // 输出日志
    log_file: './logs/combined.log',    // 合并日志
    time: true,                         // 日志带时间戳
    kill_timeout: 5000                  // 优雅关闭超时时间
  }]
};