const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to your preferred email service
    auth: {
      user: process.env.EMAIL_USER || 'official.jhapartment@gmail.com',
      pass: process.env.EMAIL_PASS || 'gcme okaj qiyf ubki' // Replace with your Gmail App Password
    }
  });
};

// Format currency for display
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount);
};

// Format date for display
const formatDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  } catch (error) {
    return 'N/A';
  }
};

// Generate HTML bill template
const generateBillHTML = (bill) => {
  const electricReading = bill.electric_present_reading && bill.electric_previous_reading 
    ? `${bill.electric_previous_reading} → ${bill.electric_present_reading}` 
    : 'N/A';
  
  const electricConsumption = bill.electric_consumption || 0;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .bill-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .bill-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
        .bill-info h3 { margin: 0 0 15px 0; color: #333; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .info-label { font-weight: bold; color: #666; }
        .info-value { color: #333; }
        .charges-section { margin-bottom: 25px; }
        .charges-section h3 { border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 20px; color: #333; }
        .charge-item { display: flex; justify-content: space-between; padding: 15px; margin-bottom: 10px; border-radius: 6px; }
        .charge-rent { background: #e3f2fd; border-left: 4px solid #2196f3; }
        .charge-electric { background: #fff3e0; border-left: 4px solid #ff9800; }
        .charge-water { background: #e8f5e8; border-left: 4px solid #4caf50; }
        .total-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .total-amount { font-size: 32px; font-weight: bold; margin: 10px 0; }
        .footer { padding: 20px; text-align: center; color: #666; border-top: 1px solid #eee; }
        .payment-note { background: #f0f8ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="bill-container">
        <!-- Header -->
        <div class="header">
          <h1>${bill.branch_name || 'JH APARTMENT'}</h1>
          <p>${bill.branch_address || 'Patin-ay, Prosperidad, Agusan del Sur'}</p>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Bill Information -->
          <div class="bill-info">
            <h3>Bill Information</h3>
            <div class="info-row">
              <span class="info-label">Tenant Name:</span>
              <span class="info-value">${bill.tenant_name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Room Number:</span>
              <span class="info-value">${bill.room_number}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bill Period:</span>
              <span class="info-value">${formatDate(bill.rent_from)} - ${formatDate(bill.rent_to)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bill Date:</span>
              <span class="info-value">${formatDate(bill.bill_date)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Due Date:</span>
              <span class="info-value">${formatDate(bill.rent_to)}</span>
            </div>
          </div>

          <!-- Charges Breakdown -->
          <div class="charges-section">
            <h3>Charges Breakdown</h3>
            
            <!-- Rent -->
            <div class="charge-item charge-rent">
              <div>
                <strong>Monthly Rent</strong>
                <br><small>Period: ${formatDate(bill.rent_from)} - ${formatDate(bill.rent_to)}</small>
              </div>
              <div style="text-align: right;">
                <strong>${formatCurrency(bill.rent_amount)}</strong>
              </div>
            </div>

            <!-- Electric -->
            <div class="charge-item charge-electric">
              <div>
                <strong>Electricity</strong>
                <br><small>Reading: ${electricReading} (${electricConsumption} kWh)</small>
                <br><small>Rate: ₱${bill.electric_rate_per_kwh}/kWh</small>
              </div>
              <div style="text-align: right;">
                <strong>${formatCurrency(bill.electric_amount || 0)}</strong>
              </div>
            </div>

            <!-- Water -->
            <div class="charge-item charge-water">
              <div>
                <strong>Water</strong>
                <br><small>Fixed monthly charge</small>
              </div>
              <div style="text-align: right;">
                <strong>${formatCurrency(bill.water_amount)}</strong>
              </div>
            </div>

            ${bill.extra_fee_amount > 0 ? `
            <!-- Extra Fees -->
            <div class="charge-item" style="background: #f3e5f5; border-left: 4px solid #9c27b0;">
              <div>
                <strong>Extra Fees</strong>
                <br><small>${bill.extra_fee_description || 'Additional charges'}</small>
              </div>
              <div style="text-align: right;">
                <strong>${formatCurrency(bill.extra_fee_amount)}</strong>
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Total -->
          <div class="total-section">
            <div>Total Amount Due</div>
            <div class="total-amount">${formatCurrency(bill.total_amount)}</div>
            <div>Status: ${bill.status.toUpperCase()}</div>
          </div>

          <!-- Payment Note -->
          <div class="payment-note">
            <strong>Payment Instructions:</strong><br>
            Please pay your bill on or before the due date to avoid any late fees. 
            Contact the management office for payment methods and assistance.
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>This is an automatically generated bill. For questions or concerns, please contact the management office.</p>
          <p><strong>Generated on:</strong> ${formatDate(new Date())}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send bill to tenant via email
const sendBillToTenant = async (bill, recipientEmail, customMessage = '') => {
  try {
    const transporter = createTransporter();
    
    const subject = `Monthly Bill - Room ${bill.room_number} - ${formatDate(bill.bill_date)}`;
    const htmlContent = generateBillHTML(bill);
    
    let textMessage = `
Dear ${bill.tenant_name},

Your monthly bill for Room ${bill.room_number} is ready.

Bill Period: ${formatDate(bill.rent_from)} - ${formatDate(bill.rent_to)}
Total Amount: ${formatCurrency(bill.total_amount)}
Due Date: ${formatDate(bill.rent_to)}

Breakdown:
- Rent: ${formatCurrency(bill.rent_amount)}
- Electricity: ${formatCurrency(bill.electric_amount || 0)}
- Water: ${formatCurrency(bill.water_amount)}${bill.extra_fee_amount > 0 ? `
- Extra Fees: ${formatCurrency(bill.extra_fee_amount)} (${bill.extra_fee_description || 'Additional charges'})` : ''}

Please pay on or before the due date.

Thank you,
${bill.branch_name || 'JH Apartment'} Management
    `;

    if (customMessage) {
      textMessage = `${customMessage}\n\n${textMessage}`;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@jhapartment.com',
      to: recipientEmail,
      subject: subject,
      text: textMessage,
      html: htmlContent,
      attachments: [] // Could add PDF attachment in the future
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Send receipt to tenant via email
const sendReceiptToTenant = async (bill, payments, recipientEmail, pdfBuffer) => {
  try {
    const transporter = createTransporter();
    
    const subject = `Payment Receipt - Room ${bill.room_number} - ${formatDate(new Date())}`;
    
    let textMessage = `
Dear ${bill.tenant_name},

Thank you for your payment! Please find your official receipt attached.

Receipt Details:
- Bill Period: ${formatDate(bill.rent_from)} - ${formatDate(bill.rent_to)}
- Total Amount: ${formatCurrency(bill.total_amount)}
- Amount Paid: ${formatCurrency(payments.reduce((sum, p) => sum + parseFloat(p.amount), 0))}
- Payment Date: ${formatDate(payments[payments.length - 1].payment_date)}
- Status: FULLY PAID

This receipt serves as official proof of payment.

Thank you for choosing ${bill.branch_name || 'J&H Apartment'}!

Best regards,
${bill.branch_name || 'J&H Apartment'} Management
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@jhapartment.com',
      to: recipientEmail,
      subject: subject,
      text: textMessage,
      attachments: [
        {
          filename: `receipt-${bill.id}-${Date.now()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: 'Receipt sent successfully via email',
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Receipt email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send welcome email to new tenant
const sendWelcomeEmail = async (tenant, roomInfo) => {
  try {
    // Emails are now enabled - attempting to send welcome email
    
    const transporter = createTransporter();
    
    const subject = `Welcome to J&H Apartment! - Room ${roomInfo.room_number}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .welcome-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 15px 0; }
          .deposit-info { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0; }
          .contract-info { background: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; margin: 15px 0; }
          .footer { padding: 20px; text-align: center; color: #666; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🏠 Welcome to J&H Apartment!</h1>
            <p>Your new home awaits you</p>
          </div>
          
          <div class="content">
            <div class="welcome-section">
              <h2>Dear ${tenant.name},</h2>
              <p>We are thrilled to welcome you to J&H Apartment! Thank you for choosing us as your new home. We're committed to providing you with a comfortable and pleasant living experience.</p>
            </div>
            
            <div class="info-box">
              <h3>📋 Your Tenancy Details</h3>
              <p><strong>Room Number:</strong> ${roomInfo.room_number}</p>
              <p><strong>Monthly Rent:</strong> ${formatCurrency(roomInfo.monthly_rent)}</p>
              <p><strong>Contract Start:</strong> ${formatDate(tenant.contract_start_date)}</p>
              <p><strong>Contract End:</strong> ${formatDate(tenant.contract_end_date)}</p>
              <p><strong>Contract Duration:</strong> ${tenant.contract_duration_months} months</p>
            </div>
            
            <div class="deposit-info">
              <h3>💰 Deposit Information</h3>
              <p><strong>Advance Payment:</strong> ${formatCurrency(tenant.advance_payment)}</p>
              <p><strong>Security Deposit:</strong> ${formatCurrency(tenant.security_deposit)}</p>
              <p><strong>Total Required:</strong> ${formatCurrency(parseFloat(tenant.advance_payment) + parseFloat(tenant.security_deposit))}</p>
              <p><em>A separate deposit receipt will be sent to you once payment is confirmed.</em></p>
            </div>
            
            <div class="contract-info">
              <h3>📋 Important Information</h3>
              <ul>
                <li>Your rent is due monthly in advance</li>
                <li>Water and electricity bills will be calculated based on usage</li>
                <li>We'll notify you 1 month before your contract expires</li>
                <li>Please keep your deposit receipts for future reference</li>
                <li>Contact management for any maintenance requests</li>
              </ul>
            </div>
            
            <div class="welcome-section">
              <h3>📞 Contact Information</h3>
              <p><strong>Management Office:</strong> Available during business hours</p>
              <p><strong>Email:</strong> official.jhapartment@gmail.com</p>
              <p><strong>Address:</strong> Patin-ay, Prosperidad, Agusan Del Sur</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 18px; color: #667eea;"><strong>Welcome to your new home! 🏡</strong></p>
            </div>
          </div>
          
          <div class="footer">
            <p>This email was sent automatically by J&H Apartment Management System</p>
            <p>If you have any questions, please contact our management office</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
Dear ${tenant.name},

Welcome to J&H Apartment! 

Your Tenancy Details:
- Room Number: ${roomInfo.room_number}
- Monthly Rent: ${formatCurrency(roomInfo.monthly_rent)}
- Contract Period: ${formatDate(tenant.contract_start_date)} to ${formatDate(tenant.contract_end_date)}
- Duration: ${tenant.contract_duration_months} months

Deposit Information:
- Advance Payment: ${formatCurrency(tenant.advance_payment)}
- Security Deposit: ${formatCurrency(tenant.security_deposit)}
- Total Required: ${formatCurrency(parseFloat(tenant.advance_payment) + parseFloat(tenant.security_deposit))}

Important Notes:
- Monthly rent is due in advance
- We'll notify you 1 month before contract expiry
- Keep deposit receipts for reference
- Contact management for maintenance requests

Welcome to your new home!

Best regards,
J&H Apartment Management
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'official.jhapartment@gmail.com',
      to: tenant.email,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Welcome email sent successfully'
    };
  } catch (error) {
    console.error('Welcome email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send deposit receipt email
const sendDepositReceiptEmail = async (tenant, roomInfo, depositReceiptBuffer) => {
  try {
    // Emails are now enabled - attempting to send deposit receipt email
    
    const transporter = createTransporter();
    
    const subject = `Deposit Receipt - Room ${roomInfo.room_number} - J&H Apartment`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .receipt-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .amount-box { background: #e8f5e8; border: 2px solid #28a745; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>💰 Deposit Receipt</h1>
            <p>Official Payment Confirmation</p>
          </div>
          
          <div class="content">
            <div class="receipt-info">
              <h3>Dear ${tenant.name},</h3>
              <p>Thank you for your payment! We have received your advance payment and security deposit for Room ${roomInfo.room_number}.</p>
            </div>
            
            <div class="amount-box">
              <h3>Payment Summary</h3>
              <p><strong>Advance Payment:</strong> ${formatCurrency(tenant.advance_payment)}</p>
              <p><strong>Security Deposit:</strong> ${formatCurrency(tenant.security_deposit)}</p>
              <hr style="margin: 15px 0;">
              <p style="font-size: 18px;"><strong>Total Paid: ${formatCurrency(parseFloat(tenant.advance_payment) + parseFloat(tenant.security_deposit))}</strong></p>
            </div>
            
            <div class="receipt-info">
              <h3>📋 Receipt Details</h3>
              <p><strong>Receipt Date:</strong> ${formatDate(new Date())}</p>
              <p><strong>Tenant:</strong> ${tenant.name}</p>
              <p><strong>Room:</strong> ${roomInfo.room_number}</p>
              <p><strong>Contract Period:</strong> ${formatDate(tenant.contract_start_date)} to ${formatDate(tenant.contract_end_date)}</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4>📄 Official Receipt Attached</h4>
              <p>Please find your official deposit receipt attached to this email. Keep this receipt for your records as proof of payment.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #28a745; font-weight: bold;">✅ Payment Confirmed - Welcome to J&H Apartment!</p>
            </div>
          </div>
          
          <div class="footer">
            <p>This receipt is automatically generated and serves as official proof of payment</p>
            <p>For any questions, please contact our management office</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
Dear ${tenant.name},

DEPOSIT RECEIPT - J&H APARTMENT

Thank you for your payment! We have received your deposits for Room ${roomInfo.room_number}.

Payment Summary:
- Advance Payment: ${formatCurrency(tenant.advance_payment)}
- Security Deposit: ${formatCurrency(tenant.security_deposit)}
- Total Paid: ${formatCurrency(parseFloat(tenant.advance_payment) + parseFloat(tenant.security_deposit))}

Receipt Details:
- Date: ${formatDate(new Date())}
- Tenant: ${tenant.name}
- Room: ${roomInfo.room_number}
- Contract: ${formatDate(tenant.contract_start_date)} to ${formatDate(tenant.contract_end_date)}

Your official receipt is attached to this email. Please keep it for your records.

Welcome to J&H Apartment!

Best regards,
J&H Apartment Management
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'official.jhapartment@gmail.com',
      to: tenant.email,
      subject: subject,
      text: textContent,
      html: htmlContent,
      attachments: [
        {
          filename: `deposit-receipt-${tenant.id}-${Date.now()}.pdf`,
          content: depositReceiptBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Deposit receipt email sent successfully'
    };
  } catch (error) {
    console.error('Deposit receipt email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send contract expiry notification
const sendContractExpiryNotification = async (tenant, roomInfo) => {
  try {
    // Emails are now enabled - attempting to send contract expiry notification
    
    const transporter = createTransporter();
    
    const subject = `Contract Expiry Notice - Room ${roomInfo.room_number} - Action Required`;
    
    const daysUntilExpiry = Math.ceil((new Date(tenant.contract_end_date) - new Date()) / (1000 * 60 * 60 * 24));
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .notice-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .info-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .action-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>⚠️ Contract Expiry Notice</h1>
            <p>Important: Action Required</p>
          </div>
          
          <div class="content">
            <div class="notice-box">
              <h3>Dear ${tenant.name},</h3>
              <p style="font-size: 16px;"><strong>Your tenancy contract will expire in ${daysUntilExpiry} days.</strong></p>
              <p>Contract End Date: <strong>${formatDate(tenant.contract_end_date)}</strong></p>
            </div>
            
            <div class="info-section">
              <h3>📋 Current Contract Details</h3>
              <p><strong>Room Number:</strong> ${roomInfo.room_number}</p>
              <p><strong>Contract Start:</strong> ${formatDate(tenant.contract_start_date)}</p>
              <p><strong>Contract End:</strong> ${formatDate(tenant.contract_end_date)}</p>
              <p><strong>Monthly Rent:</strong> ${formatCurrency(roomInfo.monthly_rent)}</p>
            </div>
            
            <div class="action-box">
              <h3>🔄 Renewal Options</h3>
              <p>If you wish to continue staying with us, please contact our management office to discuss renewal terms:</p>
              <ul>
                <li>Standard 6-month contract renewal</li>
                <li>Custom contract duration options available</li>
                <li>Current rent rates may apply</li>
                <li>New contract to be signed before expiry date</li>
              </ul>
            </div>
            
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4>⏰ Important Deadlines</h4>
              <p><strong>Please notify us of your intentions by:</strong> ${formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}</p>
              <p>This will allow us sufficient time to process your renewal or arrange for a smooth transition.</p>
            </div>
            
            <div class="info-section">
              <h3>📞 Contact Management</h3>
              <p><strong>Email:</strong> official.jhapartment@gmail.com</p>
              <p><strong>Visit:</strong> Management Office during business hours</p>
              <p><strong>Address:</strong> Patin-ay, Prosperidad, Agusan Del Sur</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #ff6b6b; font-weight: bold;">⚠️ Please respond within 7 days to avoid any complications</p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated reminder sent 30 days before contract expiry</p>
            <p>Thank you for being a valued tenant at J&H Apartment</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
Dear ${tenant.name},

CONTRACT EXPIRY NOTICE - J&H APARTMENT

Your tenancy contract will expire in ${daysUntilExpiry} days.

Contract Details:
- Room: ${roomInfo.room_number}
- Contract End: ${formatDate(tenant.contract_end_date)}
- Monthly Rent: ${formatCurrency(roomInfo.monthly_rent)}

Renewal Options:
- Standard 6-month renewal available
- Custom duration options
- Contact management office to discuss terms

Important:
Please notify us of your intentions by ${formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}

Contact Information:
Email: official.jhapartment@gmail.com
Visit: Management Office during business hours

Please respond within 7 days to avoid complications.

Thank you for being a valued tenant.

Best regards,
J&H Apartment Management
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'official.jhapartment@gmail.com',
      to: tenant.email,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Contract expiry notification sent successfully'
    };
  } catch (error) {
    console.error('Contract expiry email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendBillToTenant,
  sendReceiptToTenant,
  testEmailConfig,
  generateBillHTML,
  sendWelcomeEmail,
  sendDepositReceiptEmail,
  sendContractExpiryNotification
}; 