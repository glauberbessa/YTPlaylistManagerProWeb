export interface Channel {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  thumbnailUrl: string;
  subscribedAt?: string;
}

export interface ChannelConfig {
  id: string;
  channelId: string;
  title: string;
  isEnabled: boolean;
  subscriptionDate?: string;
  totalDurationSeconds: number;
}

export interface ChannelWithConfig extends Channel {
  config?: ChannelConfig;
}
