export interface AddressParams {
  id?: number | string;
  address_line1: string; // Required, max length 255 characters
  address_line2?: string | null; // Optional, max length 255 characters
  city: string; // Required, max length 100 characters
  landmark?: string | null; // Optional, max length 255 characters
  state: string; // Required, max length 100 characters
  zipcode: string; // Required, max length 10 characters
  mobile: string; // Required, max length 15 characters
  address_type: "home" | "work" | "other"; // Required, allowed values: "home", "work", "other"
  country: string; // Required, max length 100 characters
  country_code: string; // Required, max length 5 characters
  latitude?: number | null; // Optional
  longitude?: number | null; // Optional
}

export interface UpdateUserParams {
  name?: string;
  email?: string;
  mobile?: string;
  profile_image?: File | string | null;
  country?: string;
  iso_2?: string;
  friends_code?: string | number;
}

export interface RegisterUserParams {
  name: string;
  email: string;
  mobile: number | string;
  iso_2: string;
  country: string;
  password: string;
  password_confirmation: string;
  friends_code?: string | number;
  referral_code?: string;
  idToken?: string;
}

export interface AddBalanceParams {
  amount: number; // Required, must be >= 0.01
  payment_method: string; // Required, max length 50
  transaction_reference?: string | null; // Optional, max length 100
  description?: string | null; // Optional
  redirect_url: string | null;
}

export interface PrepareWalletRechargeResponse {
  wallet: {
    id: number;
    user_id: number;
    balance: string;
    blocked_balance: string;
    currency_code: string;
    created_at: string;
    updated_at: string;
  };
  transaction: {
    id: number;
    wallet_id: number;
    user_id: number;
    order_id: number | null;
    store_id: number | null;
    transaction_type: string; // e.g., "deposit"
    payment_method: string; // e.g., "razorpayPayment"
    amount: string;
    currency_code: string;
    status: string; // e.g., "pending"
    transaction_reference: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  };
  payment_response: {
    amount: number;
    amount_due: number;
    amount_paid: number;
    attempts: number;
    created_at: number; // UNIX timestamp
    currency: string; // e.g., "INR"
    entity: string; // e.g., "order"
    id: string; // e.g., "order_RYL3HN9EqMa3se"
    notes: {
      transaction_id: string;
      type: string; // e.g., "wallet_recharge"
      user_id: number;
    };
    offer_id: string | null;
    receipt: string;
    status: string; // e.g., "created"
    link: string;
  };
}

export interface DeductBalanceParams {
  amount: number; // Required, must be >= 0.01
  order_id?: number | string; // Optional
  store_id?: string | null; // Optional, max length 100
  description?: string | null; // Optional
}

export interface WalletTransactionParams {
  max_amount?: string;
  min_amount?: string;
  order?: string;
  page?: string | number;
  per_page?: string | number;
  query?: string;
  sort?: string;
  status?: string;
  transaction_type?: string;
  access_token?: string | null;
}
