/**
 * SupabasePasswordResetRepository
 *
 * Concrete implementation of PasswordResetRepository port using Supabase.
 */

import { PasswordResetRepository } from '@ethio-maids/app-identity';
import { PasswordReset } from '@ethio-maids/domain-identity';

export class SupabasePasswordResetRepository extends PasswordResetRepository {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  /**
   * Save or update password reset
   */
  async save(passwordReset) {
    const record = this._mapToRecord(passwordReset);

    const { data, error } = await this.supabase
      .from('password_resets')
      .upsert(record, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save password reset: ${error.message}`);
    }

    return this._mapToEntity(data);
  }

  /**
   * Find password reset by token
   */
  async findByToken(token) {
    const { data, error } = await this.supabase
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find password reset: ${error.message}`);
    }

    return this._mapToEntity(data);
  }

  /**
   * Find password reset by ID
   */
  async findById(id) {
    const { data, error } = await this.supabase
      .from('password_resets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find password reset: ${error.message}`);
    }

    return this._mapToEntity(data);
  }

  /**
   * Find all pending resets for a user
   */
  async findPendingByUserId(userId) {
    const { data, error } = await this.supabase
      .from('password_resets')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find pending resets: ${error.message}`);
    }

    return data.map(record => this._mapToEntity(record));
  }

  /**
   * Cancel all pending resets for a user
   */
  async cancelPendingResets(userId) {
    const { error } = await this.supabase
      .from('password_resets')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      throw new Error(`Failed to cancel pending resets: ${error.message}`);
    }
  }

  /**
   * Delete expired resets (cleanup)
   */
  async deleteExpired() {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('password_resets')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (error) {
      throw new Error(`Failed to delete expired resets: ${error.message}`);
    }

    return data ? data.length : 0;
  }

  /**
   * Map database record to PasswordReset entity
   */
  _mapToEntity(record) {
    if (!record) return null;

    return new PasswordReset({
      id: record.id,
      userId: record.user_id,
      email: record.email,
      token: record.token,
      expiresAt: new Date(record.expires_at),
      createdAt: new Date(record.created_at),
      usedAt: record.used_at ? new Date(record.used_at) : null,
      status: record.status,
      ipAddress: record.ip_address,
    });
  }

  /**
   * Map PasswordReset entity to database record
   */
  _mapToRecord(passwordReset) {
    return {
      id: passwordReset.id,
      user_id: passwordReset.userId,
      email: passwordReset.email,
      token: passwordReset.token,
      expires_at: passwordReset.expiresAt.toISOString(),
      created_at: passwordReset.createdAt.toISOString(),
      used_at: passwordReset.usedAt ? passwordReset.usedAt.toISOString() : null,
      status: passwordReset.status,
      ip_address: passwordReset.ipAddress,
    };
  }
}
