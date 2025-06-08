# 🏠 J&H Apartment Management - Deposit & Advance Payment System

## 📋 Overview

The J&H Apartment Management System now includes a comprehensive deposit and advance payment tracking system. This feature ensures tenants pay required deposits before moving in and provides flexible options for using these deposits for bill payments.

## 💰 Deposit Requirements

### Required Payments for New Tenants:
- **Advance Payment**: ₱3,500 (1 month rent in advance)
- **Security Deposit**: ₱3,500 (for damages, utilities, etc.)
- **Total Required**: ₱7,000 before move-in

## 🔧 System Features

### 1. **Tenant Creation with Deposits**
- When adding a new tenant, admin can:
  - Set advance payment and security deposit amounts (default ₱3,500 each)
  - Mark deposits as "Paid" or "Unpaid"
  - Track deposit status and usage over time

### 2. **Deposit Usage for Bill Payments**
- Tenants can use their deposits to pay bills through multiple options:
  - **Full Bill Payment**: Use deposit to pay entire bill
  - **Rent Only**: Apply deposit specifically to rent portion
  - **Electricity Only**: Use for electricity charges only
  - **Water Only**: Apply to water charges only

### 3. **Admin Controls**
- Complete control over when and how deposits are used
- Ability to apply security deposits to specific bill components
- Track all deposit transactions with detailed audit trail

### 4. **Move-out Processing**
- Process refunds for unused advance payments
- Handle security deposit refunds after damage assessment
- Complete transaction history for accounting

## 🖥️ User Interface Updates

### Tenant Management Page
- **New Tenant Form**: 
  - Added deposit amount fields (₱3,500 default)
  - Checkboxes to mark deposits as paid
  - Visual indicators showing deposit requirements

- **View Tenant Details**:
  - Display current deposit balances
  - Show deposit status (Paid/Unpaid)
  - View deposit transaction history button

### Billing Page
- **Enhanced Payment Modal**:
  - New payment method options: "Use Advance Payment" and "Use Security Deposit"
  - Deposit usage selector (full bill, rent only, electricity only, water only)
  - Real-time deposit balance display
  - Validation to prevent overdrawing deposits

## 📊 Database Structure

### New Tables Created:
```sql
-- Deposit transaction tracking
deposit_transactions (
  id, tenant_id, bill_id, transaction_type, action, 
  amount, used_for, description, created_by, 
  transaction_date, created_at
)
```

### Enhanced Tables:
```sql
-- Updated tenants table
tenants (
  ...existing fields...,
  advance_payment DECIMAL(10,2) DEFAULT 3500.00,
  security_deposit DECIMAL(10,2) DEFAULT 3500.00,
  advance_payment_used DECIMAL(10,2) DEFAULT 0.00,
  security_deposit_used DECIMAL(10,2) DEFAULT 0.00,
  advance_payment_status ENUM('paid', 'unpaid') DEFAULT 'unpaid',
  security_deposit_status ENUM('paid', 'unpaid') DEFAULT 'unpaid'
)

-- Updated payments table
payments (
  ...existing fields...,
  payment_method ENUM('cash', 'bank_transfer', 'check', 
                     'advance_payment', 'security_deposit', 'other')
)
```

## 🔄 Workflow Examples

### 1. **Adding a New Tenant**
1. Admin fills out tenant information
2. Assigns room and sets rent start date
3. Deposit section shows default ₱3,500 amounts
4. Admin checks "Mark as Paid" for both deposits if received
5. System creates tenant and records deposit transactions

### 2. **Using Advance Payment for Bills**
1. Admin opens billing page and creates bill for tenant
2. Clicks "Complete Payment" on active bill
3. Selects "Use Advance Payment" as payment method
4. Chooses usage type (full bill, rent only, etc.)
5. System validates sufficient balance and processes payment
6. Deposit balance automatically updated

### 3. **Processing Move-out Refunds**
1. Admin accesses tenant deposit history
2. Reviews available balance for each deposit type
3. Processes refund for unused amounts
4. System records refund transaction for accounting

## 🛡️ Security & Validation

### Built-in Safeguards:
- ✅ Cannot use more than available deposit balance
- ✅ Deposits must be marked "Paid" before usage
- ✅ Complete audit trail of all transactions
- ✅ Validation of bill ownership before deposit usage
- ✅ Automatic balance calculations and updates

### Transaction Types Tracked:
- **Deposit**: Initial payment recording
- **Use**: Using deposit for bill payment
- **Refund**: Returning unused deposit amounts

## 📈 Benefits

### For Property Management:
- **Cash Flow**: Ensures upfront payment collection
- **Risk Mitigation**: Security deposits protect against damages
- **Automated Tracking**: No manual deposit calculations
- **Audit Trail**: Complete transaction history for accounting
- **Flexibility**: Multiple usage options for different situations

### For Tenants:
- **Convenience**: Use deposits to pay bills when needed
- **Transparency**: Clear visibility of deposit balances
- **Options**: Choose how to apply deposits (rent, utilities, etc.)

## 🚀 API Endpoints

### Deposit Management:
```
GET    /api/deposits/tenant/:tenantId/balance     - Get deposit balances
GET    /api/deposits/tenant/:tenantId/history     - Get transaction history
PUT    /api/deposits/tenant/:tenantId/status      - Update deposit status
POST   /api/deposits/tenant/:tenantId/use/:billId - Use deposit for bill
POST   /api/deposits/tenant/:tenantId/refund      - Process refund
```

## ⚙️ Configuration

### Default Settings (configurable):
- `default_advance_payment`: ₱3,500.00
- `default_security_deposit`: ₱3,500.00

### Customizable Options:
- Deposit amounts can be adjusted per tenant
- Usage rules can be modified through admin controls
- Refund policies configurable through transaction system

## 📞 Support

The deposit system is fully integrated with the existing J&H Apartment Management System. All existing features continue to work normally, with enhanced deposit tracking capabilities.

For questions or issues, the system maintains detailed logs and error messages for troubleshooting.

---

**Status**: ✅ ACTIVE - Deposit system is fully operational
**Last Updated**: $(date)
**Database Migration**: Completed successfully 