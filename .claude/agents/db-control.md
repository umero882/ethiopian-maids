---
name: db-control
description: db control
model: opus
color: green
---

# Database Control Agent

## Overview

The Database Control Agent is a specialized component designed to manage and control database operations for the Ethio-Maids platform. This agent provides a centralized interface for database interactions, ensuring consistency, security, and optimal performance across all database operations.

## Features

### Core Functionality
- **Connection Management**: Handles database connection pooling and lifecycle
- **Query Execution**: Executes SQL queries with proper error handling and logging
- **Transaction Control**: Manages database transactions with rollback capabilities
- **Schema Management**: Handles database schema migrations and updates
- **Data Validation**: Validates data integrity before database operations

### Security Features
- **SQL Injection Prevention**: Uses parameterized queries and input sanitization
- **Access Control**: Implements role-based database access permissions
- **Audit Logging**: Tracks all database operations for compliance and debugging
- **Data Encryption**: Handles sensitive data encryption/decryption

### Performance Optimization
- **Query Optimization**: Analyzes and optimizes database queries
- **Caching Layer**: Implements intelligent caching strategies
- **Connection Pooling**: Manages database connections efficiently
- **Batch Operations**: Supports bulk operations for improved performance

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │  DB Control     │    │   Database      │
│     Layer       │───▶│     Agent       │───▶│   (Supabase)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## API Interface

### Core Methods

#### Connection Management
```javascript
// Initialize database connection
await dbAgent.connect(connectionConfig)

// Close database connection
await dbAgent.disconnect()

// Get connection status
const status = dbAgent.getConnectionStatus()
```

#### Query Operations
```javascript
// Execute SELECT query
const results = await dbAgent.query('SELECT * FROM users WHERE id = $1', [userId])

// Execute INSERT/UPDATE/DELETE
const result = await dbAgent.execute('INSERT INTO maids (...) VALUES (...)', [data])

// Batch operations
const results = await dbAgent.batch([
  { query: 'INSERT INTO...', params: [...] },
  { query: 'UPDATE...', params: [...] }
])
```

#### Transaction Management
```javascript
// Start transaction
const transaction = await dbAgent.beginTransaction()

try {
  await transaction.query('INSERT INTO...')
  await transaction.query('UPDATE...')
  await transaction.commit()
} catch (error) {
  await transaction.rollback()
  throw error
}
```

### Specialized Operations

#### User Management
```javascript
// Create new user
await dbAgent.createUser(userData)

// Update user profile
await dbAgent.updateUser(userId, updateData)

// Delete user (soft delete)
await dbAgent.deleteUser(userId)

// Get user by various criteria
const user = await dbAgent.getUser({ email, id, phone })
```

#### Maid Management
```javascript
// Register new maid
await dbAgent.createMaid(maidData)

// Update maid profile
await dbAgent.updateMaidProfile(maidId, profileData)

// Search maids with filters
const maids = await dbAgent.searchMaids(filters)

// Update maid availability
await dbAgent.updateMaidAvailability(maidId, status)
```

#### Agency Operations
```javascript
// Register agency
await dbAgent.createAgency(agencyData)

// Assign maid to agency
await dbAgent.assignMaidToAgency(maidId, agencyId)

// Get agency maids
const maids = await dbAgent.getAgencyMaids(agencyId)
```

## Configuration

### Environment Variables
```env
DB_HOST=your-supabase-host
DB_PORT=5432
DB_NAME=postgres
DB_USER=your-username
DB_PASSWORD=your-password
DB_SSL=require
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_TIMEOUT=30000
```

### Agent Configuration
```javascript
const dbConfig = {
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN),
    max: parseInt(process.env.DB_POOL_MAX),
    createTimeoutMillis: parseInt(process.env.DB_TIMEOUT),
    acquireTimeoutMillis: parseInt(process.env.DB_TIMEOUT),
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000
  },
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 1000
  }
}
```

## Usage Examples

### Basic CRUD Operations
```javascript
import { DatabaseControlAgent } from './db-control-agent'

const dbAgent = new DatabaseControlAgent(dbConfig)

// Initialize
await dbAgent.initialize()

// Create a new maid
const newMaid = await dbAgent.createMaid({
  name: 'Almaz Tadesse',
  age: 28,
  experience_years: 5,
  skills: ['cooking', 'cleaning', 'childcare'],
  location: 'Addis Ababa',
  availability: 'available'
})

// Search for maids
const availableMaids = await dbAgent.searchMaids({
  availability: 'available',
  location: 'Addis Ababa',
  minExperience: 3
})

// Update maid status
await dbAgent.updateMaidAvailability(maidId, 'hired')
```

### Advanced Operations
```javascript
// Complex query with joins
const maidDetails = await dbAgent.query(`
  SELECT m.*, a.agency_name, r.rating, r.review_count
  FROM maids m
  LEFT JOIN agencies a ON m.agency_id = a.id
  LEFT JOIN (
    SELECT maid_id, AVG(rating) as rating, COUNT(*) as review_count
    FROM reviews
    GROUP BY maid_id
  ) r ON m.id = r.maid_id
  WHERE m.id = $1
`, [maidId])

// Batch operation for bulk updates
await dbAgent.batch([
  {
    query: 'UPDATE maids SET last_updated = NOW() WHERE agency_id = $1',
    params: [agencyId]
  },
  {
    query: 'INSERT INTO audit_log (action, entity_type, entity_id) VALUES ($1, $2, $3)',
    params: ['bulk_update', 'maid', agencyId]
  }
])
```

## Error Handling

### Error Types
- **ConnectionError**: Database connection issues
- **QueryError**: SQL query execution errors
- **ValidationError**: Data validation failures
- **TransactionError**: Transaction-related errors
- **PermissionError**: Access control violations

### Error Handling Example
```javascript
try {
  const result = await dbAgent.createUser(userData)
  return result
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.log('Validation failed:', error.details)
  } else if (error instanceof ConnectionError) {
    // Handle connection errors
    console.log('Database connection failed:', error.message)
  } else {
    // Handle other errors
    console.log('Unexpected error:', error)
  }
  throw error
}
```

## Security Considerations

### Best Practices
1. **Always use parameterized queries** to prevent SQL injection
2. **Validate all input data** before database operations
3. **Use transactions** for multi-step operations
4. **Implement proper access control** based on user roles
5. **Log all database operations** for audit purposes
6. **Encrypt sensitive data** before storage
7. **Use connection pooling** to prevent connection exhaustion

### Access Control Matrix
| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Agency | ✅* | ✅* | ✅* | ❌ |
| Maid | ❌ | ✅* | ✅* | ❌ |
| Sponsor | ❌ | ✅* | ❌ | ❌ |

*Limited to own data or related entities

## Performance Monitoring

### Metrics to Track
- Query execution time
- Connection pool utilization
- Cache hit/miss ratios
- Transaction success/failure rates
- Error rates by operation type

### Monitoring Implementation
```javascript
// Add performance monitoring
dbAgent.on('query', (queryInfo) => {
  console.log(`Query executed: ${queryInfo.query} (${queryInfo.duration}ms)`)
})

dbAgent.on('error', (error) => {
  console.error('Database error:', error)
  // Send to monitoring service
})
```

## Testing

### Unit Tests
```javascript
describe('DatabaseControlAgent', () => {
  let dbAgent

  beforeEach(async () => {
    dbAgent = new DatabaseControlAgent(testConfig)
    await dbAgent.initialize()
  })

  afterEach(async () => {
    await dbAgent.cleanup()
  })

  it('should create a new maid', async () => {
    const maidData = { /* test data */ }
    const result = await dbAgent.createMaid(maidData)
    expect(result.id).toBeDefined()
  })
})
```

## Migration Support

### Schema Migrations
```javascript
// Run pending migrations
await dbAgent.runMigrations()

// Create new migration
await dbAgent.createMigration('add_new_column_to_maids')

// Rollback migration
await dbAgent.rollbackMigration('migration_name')
```

## Deployment

### Production Checklist
- [ ] Configure production database credentials
- [ ] Set up connection pooling
- [ ] Enable query logging
- [ ] Configure backup strategies
- [ ] Set up monitoring and alerts
- [ ] Test disaster recovery procedures

### Environment-Specific Configs
```javascript
// Development
const devConfig = {
  ...baseConfig,
  debug: true,
  logQueries: true
}

// Production
const prodConfig = {
  ...baseConfig,
  debug: false,
  logQueries: false,
  pool: { min: 5, max: 20 }
}
```

## Support and Maintenance

### Regular Maintenance Tasks
1. **Database cleanup**: Remove old audit logs and temporary data
2. **Index optimization**: Analyze and optimize database indexes
3. **Performance review**: Monitor query performance and optimize slow queries
4. **Security audit**: Review access logs and update permissions
5. **Backup verification**: Test backup and restore procedures

### Troubleshooting Common Issues
- **Connection timeouts**: Increase timeout values or check network connectivity
- **Query performance**: Analyze query execution plans and add indexes
- **Memory issues**: Adjust connection pool settings
- **Lock conflicts**: Review transaction isolation levels

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial release |
| 1.1.0 | 2024-02-01 | Added caching layer |
| 1.2.0 | 2024-03-01 | Enhanced security features |

## Contributing

Please refer to the main project's contributing guidelines for information on how to contribute to the Database Control Agent.

## License

This component is part of the Ethio-Maids platform and follows the same licensing terms as the main project.
