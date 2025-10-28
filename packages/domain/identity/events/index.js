/**
 * Domain Events for Identity Context
 *
 * Events are emitted by aggregates and consumed by other bounded contexts.
 */

export const DomainEvents = {
  UserRegistered: 'UserRegistered',
  UserEmailVerified: 'UserEmailVerified',
  UserPhoneVerified: 'UserPhoneVerified',
  UserSuspended: 'UserSuspended',
  UserReactivated: 'UserReactivated',
  UserDeleted: 'UserDeleted',
  PasswordChanged: 'PasswordChanged',
  LoginAttempted: 'LoginAttempted',
  LoginSucceeded: 'LoginSucceeded',
  LoginFailed: 'LoginFailed',
};

export function createDomainEvent(type, payload, metadata = {}) {
  return {
    type,
    payload,
    metadata: {
      occurredAt: new Date().toISOString(),
      ...metadata,
    },
  };
}
