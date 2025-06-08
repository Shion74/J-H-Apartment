const Setting = require('../models/setting');

// Get all settings
const getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.findAll();
    return res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get all settings error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get billing rates
const getBillingRates = async (req, res) => {
  try {
    const rates = await Setting.getBillingRates();
    return res.json({
      success: true,
      rates
    });
  } catch (error) {
    console.error('Get billing rates error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update setting
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'Setting value is required'
      });
    }

    // Validate numeric values for rates
    if ((key === 'electric_rate_per_kwh' || key === 'water_fixed_amount') && isNaN(parseFloat(value))) {
      return res.status(400).json({
        success: false,
        message: 'Rate must be a valid number'
      });
    }

    const updated = await Setting.updateValue(key, value, description);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    return res.json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Update setting error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update electricity rate
const updateElectricityRate = async (req, res) => {
  try {
    const { rate } = req.body;

    if (!rate || isNaN(parseFloat(rate))) {
      return res.status(400).json({
        success: false,
        message: 'Valid electricity rate is required'
      });
    }

    const updated = await Setting.updateValue('electric_rate_per_kwh', rate);
    
    return res.json({
      success: true,
      message: `Electricity rate updated to ₱${rate} per kWh`,
      rate: parseFloat(rate)
    });
  } catch (error) {
    console.error('Update electricity rate error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update water fixed amount
const updateWaterAmount = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({
        success: false,
        message: 'Valid water amount is required'
      });
    }

    const updated = await Setting.updateValue('water_fixed_amount', amount);
    
    return res.json({
      success: true,
      message: `Water fixed amount updated to ₱${amount} per room`,
      amount: parseFloat(amount)
    });
  } catch (error) {
    console.error('Update water amount error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update all billing rates at once
const updateBillingRates = async (req, res) => {
  try {
    const { electric_rate_per_kwh, water_fixed_amount, default_room_rate } = req.body;

    console.log('Received billing rates update:', { electric_rate_per_kwh, water_fixed_amount, default_room_rate });

    // Validate that at least one rate is provided
    if (electric_rate_per_kwh === undefined && water_fixed_amount === undefined && default_room_rate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one rate must be provided'
      });
    }

    // Validate rates
    if (electric_rate_per_kwh !== undefined && (isNaN(parseFloat(electric_rate_per_kwh)) || parseFloat(electric_rate_per_kwh) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Electric rate must be a valid positive number'
      });
    }

    if (water_fixed_amount !== undefined && (isNaN(parseFloat(water_fixed_amount)) || parseFloat(water_fixed_amount) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Water amount must be a valid positive number'
      });
    }

    if (default_room_rate !== undefined && (isNaN(parseFloat(default_room_rate)) || parseFloat(default_room_rate) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Room rate must be a valid positive number'
      });
    }

    const rates = {};
    if (electric_rate_per_kwh !== undefined) rates.electric_rate_per_kwh = parseFloat(electric_rate_per_kwh);
    if (water_fixed_amount !== undefined) rates.water_fixed_amount = parseFloat(water_fixed_amount);
    if (default_room_rate !== undefined) rates.default_room_rate = parseFloat(default_room_rate);

    console.log('Updating rates:', rates);

    const result = await Setting.updateBillingRates(rates);
    
    if (result) {
    return res.json({
      success: true,
      message: 'Billing rates updated successfully',
      updated_rates: rates
    });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to update billing rates'
      });
    }
  } catch (error) {
    console.error('Update billing rates error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error: ' + error.message 
    });
  }
};

module.exports = {
  getAllSettings,
  getBillingRates,
  updateSetting,
  updateElectricityRate,
  updateWaterAmount,
  updateBillingRates
}; 