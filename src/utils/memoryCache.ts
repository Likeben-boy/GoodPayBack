/**
 * 内存缓存实现
 * 用于替代Redis在单机模式下提供缓存功能
 */

export interface CacheItem<T = any> {
  data: T;
  expiry: number; // 过期时间戳
}

export interface MemoryCacheOptions {
  defaultTTL?: number; // 默认过期时间（毫秒）
  maxKeys?: number; // 最大缓存键数量
  cleanupInterval?: number; // 清理间隔（毫秒）
}

class MemoryCache {
  private cache: Map<string, CacheItem> = new Map();
  private defaultTTL: number;
  private maxKeys: number;
  private cleanupInterval: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: MemoryCacheOptions = {}) {
    this.defaultTTL = options.defaultTTL || 15 * 60 * 1000; // 默认15分钟
    this.maxKeys = options.maxKeys || 1000; // 默认最多1000个键
    this.cleanupInterval = options.cleanupInterval || 5 * 60 * 1000; // 默认5分钟清理一次

    // 启动定期清理过期缓存
    this.startCleanup();
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（毫秒），0表示永不过期
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // 如果超过最大键数量，删除最旧的缓存
    if (this.cache.size >= this.maxKeys) {
      this.evictOldest();
    }

    const expiry = ttl === 0 ? 0 : Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data: value, expiry });
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值，如果不存在或已过期返回null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (item.expiry > 0 && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   * @returns 是否删除成功
   */
  del(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 检查缓存是否存在且未过期
   * @param key 缓存键
   * @returns 是否存在
   */
  exists(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    // 检查是否过期
    if (item.expiry > 0 && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 为缓存键增加过期时间
   * @param key 缓存键
   * @param ttl 过期时间（毫秒）
   * @returns 是否设置成功
   */
  expire(key: string, ttl: number): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    item.expiry = Date.now() + ttl;
    return true;
  }

  /**
   * 获取缓存项的剩余过期时间（毫秒）
   * @param key 缓存键
   * @returns 剩余时间，如果不存在或永不过期返回-1
   */
  ttl(key: string): number {
    const item = this.cache.get(key);

    if (!item) {
      return -1;
    }

    if (item.expiry === 0) {
      return -1; // 永不过期
    }

    const remaining = item.expiry - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取所有缓存键的数量
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 获取所有缓存键
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 启动定期清理过期缓存
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * 清理过期的缓存项
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, item] of Array.from(this.cache.entries())) {
      if (item.expiry > 0 && now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 驱逐最旧的缓存项
   */
  private evictOldest(): void {
    if (this.cache.size === 0) {
      return;
    }

    // 简单策略：删除第一个缓存项
    // 在实际应用中可以实现LRU策略
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
    }
  }

  /**
   * 停止清理定时器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// 创建全局内存缓存实例
const memoryCache = new MemoryCache({
  defaultTTL: 15 * 60 * 1000, // 15分钟
  maxKeys: 1000,
  cleanupInterval: 5 * 60 * 1000 // 5分钟
});

// 优雅关闭
process.on('SIGINT', () => {
  memoryCache.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  memoryCache.destroy();
  process.exit(0);
});

export default memoryCache;