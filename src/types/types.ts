
export interface User {
    email: string;
    userId: string;
    subscriptionDetails: SubscriptionDetails;
    dailyApiUsage: number;
    monthlyApiUsage: number;
    dailyApiLimit: number;
    monthlyApiLimit: number;
}

export type SubscriptionDetails = {
    status: string;
    price_id: string;
    start_date: string;
    end_date: string;
};

export type Settings = {
    language?: string;
    tone?: string;
    writingStyle?: string;
};

export interface Shortcut {
    type: string;
    id: string;
    shortcut_id: string;
    user_id: string;
    shortcut_keys: string;
    prompt: string;
    description?: string;
    title?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Profile {
    _id: string;
    profile_id: string;
    profile_name: string;
    is_default: string;
    createdAt: string;
    updatedAt: string;
}
