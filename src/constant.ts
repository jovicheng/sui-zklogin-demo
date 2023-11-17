export const FULLNODE_URL = "https://fullnode.devnet.sui.io";

export const CLIENT_ID =
  "573120070871-0k7ga6ns7∏9ie0jpg1ei6ip5vje2ostt6.apps.googleusercontent.com";

export const REDIRECT_URI = "https://sui-zklogin.vercel.app/";

export const KEY_PAIR_SESSION_STORAGE_KEY = "demo_ephemeral_key_pair";

export const USER_SALT_LOCAL_STORAGE_KEY = "demo_user_salt_key_pair";

export const RANDOMNESS_SESSION_STORAGE_KEY = "demo_randomness_key_pair";

export const MAX_EPOCH_LOCAL_STORAGE_KEY = "demo_max_epoch_key_pair";


export const STEPS = ['生成临时秘钥对', '获取JWT', 'Decode JWT', '生成用户的 Salt', '获取用户的 Sui 地址', '获取 ZK Proof', '组装 zkLogin 签名',]


export const STEPS_DESC = ['ephemeralKeyPair', '来自 OpenID Provider', '后续组装zkLogin签名时需要用到', '用户地址由 JWT 和 Salt 共同决定', '交易签名需要 ZK Proof', '提交交易']