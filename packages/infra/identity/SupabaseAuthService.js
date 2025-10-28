/**
 * SupabaseAuthService - Implements AuthenticationService port
 *
 * Adapter for Supabase Auth.
 */

import { AuthenticationService } from '@ethio-maids/app-identity';

export class SupabaseAuthService extends AuthenticationService {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  /**
   * Register new user
   */
  async register({ email, password, role }) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: role,
        },
      },
    });

    if (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Registration failed: No user returned');
    }

    return {
      userId: data.user.id,
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at,
      },
    };
  }

  /**
   * Sign in user
   */
  async signIn({ email, password }) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Sign in failed: No user returned');
    }

    return {
      userId: data.user.id,
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at,
      },
    };
  }

  /**
   * Sign out user
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      throw new Error(`Failed to get session: ${error.message}`);
    }

    if (!data.session) {
      return null;
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    };
  }

  /**
   * Refresh session
   */
  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession();

    if (error) {
      throw new Error(`Failed to refresh session: ${error.message}`);
    }

    return {
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresAt: data.session?.expires_at,
    };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  /**
   * Verify email with code
   */
  async verifyEmail(code) {
    const { error } = await this.supabase.auth.verifyOtp({
      token_hash: code,
      type: 'email',
    });

    if (error) {
      throw new Error(`Email verification failed: ${error.message}`);
    }

    return true;
  }
}
