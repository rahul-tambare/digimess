const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

// Type 2: Register or Update Device
exports.registerDevice = async (parameter) => {
  let t = await sequelize.transaction();

  try {
    console.log("Inside registerDevice method");

    // Check if device is already registered for this user
    let existingDeviceQuery = `
            SELECT DR_ID, DR_DEVICEID, DR_USERID, DR_CR_DATE, DR_STATUS 
            FROM TB_DEVICE_REGISTRATION 
            WHERE DR_DEVICEID = ? AND DR_USERID = ?
        `;

    let existingDevice = await sequelize.query(existingDeviceQuery, {
      replacements: [parameter.deviceId, parameter.userId],
      type: QueryTypes.SELECT,
      transaction: t,
    });

    let deviceRegistrationId;

    if (existingDevice.length > 0) {
      // Update existing device registration
      console.log("Updating existing device registration");

      let updateQuery = `
                UPDATE TB_DEVICE_REGISTRATION 
                SET 
                    DR_PLATFORM = ?,
                    DR_MODEL = ?,
                    DR_BRAND = ?,
                    DR_SYSTEM_NAME = ?,
                    DR_SYSTEM_VERSION = ?,
                    DR_BUILD_NUMBER = ?,
                    DR_IS_TABLET = ?,
                    DR_APP_VERSION = ?,
                    DR_LATITUDE = ?,
                    DR_LONGITUDE = ?,
                    DR_NETWORK_TYPE = ?,
                    DR_IS_CONNECTED = ?,
                    DR_FCM_TOKEN = ?,
                    DR_REGISTRATION_SOURCE = ?,
                    DR_STATUS = 1,
                    DR_UPD_DATE = NOW()
                WHERE DR_ID = ?
            `;

      await sequelize.query(updateQuery, {
        replacements: [
          parameter.platform,
          parameter.model || null,
          parameter.brand || null,
          parameter.systemName || null,
          parameter.systemVersion || null,
          parameter.buildNumber || null,
          parameter.isTablet || false,
          parameter.appVersion || null,
          parameter.latitude || null,
          parameter.longitude || null,
          parameter.networkType || null,
          parameter.isConnected || false,
          parameter.fcmToken || null,
          parameter.registrationSource || "app_login",
          existingDevice[0].DR_ID,
        ],
        type: QueryTypes.UPDATE,
        transaction: t,
      });

      deviceRegistrationId = existingDevice[0].DR_ID;
    } else {
      // Insert new device registration
      console.log("Creating new device registration");

      let insertQuery = `
                INSERT INTO TB_DEVICE_REGISTRATION (
                    DR_USERID, DR_DEVICEID, DR_PLATFORM,
                    DR_MODEL, DR_BRAND, DR_SYSTEM_NAME, DR_SYSTEM_VERSION,
                    DR_BUILD_NUMBER, DR_IS_TABLET, DR_APP_VERSION,
                    DR_LATITUDE, DR_LONGITUDE, DR_NETWORK_TYPE, DR_IS_CONNECTED,
                    DR_FCM_TOKEN, DR_REGISTRATION_SOURCE, DR_STATUS, DR_CR_DATE
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
            `;

      let insertResult = await sequelize.query(insertQuery, {
        replacements: [
          parameter.userId,
          parameter.deviceId,
          parameter.platform,
          parameter.model || null,
          parameter.brand || null,
          parameter.systemName || null,
          parameter.systemVersion || null,
          parameter.buildNumber || null,
          parameter.isTablet || false,
          parameter.appVersion || null,
          parameter.latitude || null,
          parameter.longitude || null,
          parameter.networkType || null,
          parameter.isConnected || false,
          parameter.fcmToken || null,
          parameter.registrationSource || "app_login",
        ],
        type: QueryTypes.INSERT,
        transaction: t,
      });

      deviceRegistrationId = insertResult[0];
    }

    // Get the registered device details
    let deviceDetailsQuery = `
            SELECT 
                dr.DR_ID,
                dr.DR_USERID,
                dr.DR_DEVICEID,
                dr.DR_PLATFORM,
                dr.DR_MODEL,
                dr.DR_BRAND,
                dr.DR_STATUS,
                dr.DR_FCM_TOKEN,
                dr.DR_CR_DATE,
                dr.DR_UPD_DATE,
                u.U_FNAME,
                u.U_LNAME,
                u.U_EMAIL,
                u.U_MOBILE
            FROM TB_DEVICE_REGISTRATION dr
            LEFT JOIN TB_USER u ON dr.DR_USERID = u.U_USERID
            WHERE dr.DR_ID = ?
        `;

    let deviceDetails = await sequelize.query(deviceDetailsQuery, {
      replacements: [deviceRegistrationId],
      type: QueryTypes.SELECT,
      transaction: t,
    });

    await t.commit();

    console.log("Device registration completed successfully");

    return {
      success: true,
      data: {
        id: deviceRegistrationId,
        deviceId: parameter.deviceId,
        userId: parameter.userId,
        platform: parameter.platform,
        status: 1,
        registrationDate: deviceDetails[0]?.DR_CR_DATE,
        updateDate: deviceDetails[0]?.DR_UPD_DATE,
        userDetails: {
          name: `${deviceDetails[0]?.U_FNAME || ""} ${
            deviceDetails[0]?.U_LNAME || ""
          }`.trim(),
          email: deviceDetails[0]?.U_EMAIL,
          mobile: deviceDetails[0]?.U_MOBILE,
        },
        isUpdate: existingDevice.length > 0,
      },
      message:
        existingDevice.length > 0
          ? "Device registration updated"
          : "Device registered successfully",
    };
  } catch (error) {
    await t.rollback();
    console.error("Error in registerDevice:", error);
    throw error;
  }
};

// Type 1: Activate Device
exports.activateDevice = async (parameter) => {
  let t = await sequelize.transaction();

  try {
    console.log(
      "Activating device:",
      parameter.deviceId,
      "for user:",
      parameter.userId
    );

    // Check if device exists for this user
    let checkQuery = `
            SELECT DR_ID, DR_STATUS, DR_DEVICEID, DR_PLATFORM, DR_MODEL 
            FROM TB_DEVICE_REGISTRATION 
            WHERE DR_DEVICEID = ? AND DR_USERID = ?
        `;

    let existingDevice = await sequelize.query(checkQuery, {
      replacements: [parameter.deviceId, parameter.userId],
      type: QueryTypes.SELECT,
      transaction: t,
    });

    if (existingDevice.length === 0) {
      await t.rollback();
      return {
        success: false,
        message: "Device not found for this user",
      };
    }

    if (existingDevice[0].DR_STATUS === 1) {
      await t.rollback();
      return {
        success: false,
        message: "Device is already active",
      };
    }

    // Activate device
    let updateQuery = `
            UPDATE TB_DEVICE_REGISTRATION 
            SET DR_STATUS = 1, DR_UPD_DATE = NOW()
            WHERE DR_DEVICEID = ? AND DR_USERID = ?
        `;

    await sequelize.query(updateQuery, {
      replacements: [parameter.deviceId, parameter.userId],
      type: QueryTypes.UPDATE,
      transaction: t,
    });

    await t.commit();

    return {
      success: true,
      data: {
        deviceId: parameter.deviceId,
        userId: parameter.userId,
        status: 1,
        previousStatus: existingDevice[0].DR_STATUS,
      },
      message: "Device activated successfully",
    };
  } catch (error) {
    await t.rollback();
    console.error("Error in activateDevice:", error);
    throw error;
  }
};

// Type 0: Deactivate Device
exports.deactivateDevice = async (parameter) => {
  let t = await sequelize.transaction();

  try {
    console.log(
      "Deactivating device:",
      parameter.deviceId,
      "for user:",
      parameter.userId
    );

    // Check if device exists for this user
    let checkQuery = `
            SELECT DR_ID, DR_STATUS, DR_DEVICEID, DR_PLATFORM, DR_MODEL 
            FROM TB_DEVICE_REGISTRATION 
            WHERE DR_DEVICEID = ? AND DR_USERID = ?
        `;

    let existingDevice = await sequelize.query(checkQuery, {
      replacements: [parameter.deviceId, parameter.userId],
      type: QueryTypes.SELECT,
      transaction: t,
    });

    if (existingDevice.length === 0) {
      await t.rollback();
      return {
        success: false,
        message: "Device not found for this user",
      };
    }

    if (existingDevice[0].DR_STATUS === 0) {
      await t.rollback();
      return {
        success: false,
        message: "Device is already inactive",
      };
    }

    // Deactivate device
    let updateQuery = `
            UPDATE TB_DEVICE_REGISTRATION 
            SET DR_STATUS = 0, DR_UPD_DATE = NOW()
            WHERE DR_DEVICEID = ? AND DR_USERID = ?
        `;

    await sequelize.query(updateQuery, {
      replacements: [parameter.deviceId, parameter.userId],
      type: QueryTypes.UPDATE,
      transaction: t,
    });

    await t.commit();

    return {
      success: true,
      data: {
        deviceId: parameter.deviceId,
        userId: parameter.userId,
        status: 0,
        previousStatus: existingDevice[0].DR_STATUS,
      },
      message: "Device deactivated successfully",
    };
  } catch (error) {
    await t.rollback();
    console.error("Error in deactivateDevice:", error);
    throw error;
  }
};

// Type 3: Get User Devices
exports.getUserDevices = async (parameter) => {
  try {
    console.log(
      "Getting devices for user:",
      parameter.userId,
      "Include inactive:",
      parameter.includeInactive
    );

    let statusCondition = parameter.includeInactive
      ? ""
      : "AND dr.DR_STATUS = 1";

    let query = `
            SELECT 
                dr.DR_ID,
                dr.DR_DEVICEID,
                dr.DR_PLATFORM,
                dr.DR_MODEL,
                dr.DR_BRAND,
                dr.DR_SYSTEM_NAME,
                dr.DR_SYSTEM_VERSION,
                dr.DR_APP_VERSION,
                dr.DR_FCM_TOKEN,
                dr.DR_STATUS,
                dr.DR_CR_DATE,
                dr.DR_UPD_DATE,
                dr.DR_LATITUDE,
                dr.DR_LONGITUDE,
                CASE 
                    WHEN dr.DR_STATUS = 1 THEN 'Active'
                    ELSE 'Inactive'
                END AS STATUS_TEXT,
                DATEDIFF(NOW(), dr.DR_CR_DATE) AS DAYS_SINCE_REGISTRATION,
                CASE 
                    WHEN dr.DR_UPD_DATE IS NOT NULL THEN DATEDIFF(NOW(), dr.DR_UPD_DATE)
                    ELSE NULL 
                END AS DAYS_SINCE_LAST_UPDATE
            FROM TB_DEVICE_REGISTRATION dr
            WHERE dr.DR_USERID = ? ${statusCondition}
            ORDER BY dr.DR_STATUS DESC, dr.DR_CR_DATE DESC
        `;

    let devices = await sequelize.query(query, {
      replacements: [parameter.userId],
      type: QueryTypes.SELECT,
    });

    // Get device statistics
    let statsQuery = `
            SELECT 
                COUNT(*) as TOTAL_DEVICES,
                SUM(CASE WHEN DR_STATUS = 1 THEN 1 ELSE 0 END) as ACTIVE_DEVICES,
                SUM(CASE WHEN DR_STATUS = 0 THEN 1 ELSE 0 END) as INACTIVE_DEVICES,
                COUNT(DISTINCT DR_PLATFORM) as UNIQUE_PLATFORMS,
                GROUP_CONCAT(DISTINCT DR_PLATFORM) as PLATFORMS_USED
            FROM TB_DEVICE_REGISTRATION 
            WHERE DR_USERID = ?
        `;

    let stats = await sequelize.query(statsQuery, {
      replacements: [parameter.userId],
      type: QueryTypes.SELECT,
    });

    return {
      success: true,
      data: {
        devices: devices,
        statistics: stats[0],
        totalCount: devices.length,
        activeCount: stats[0].ACTIVE_DEVICES,
        inactiveCount: stats[0].INACTIVE_DEVICES,
      },
      message: `Found ${devices.length} device(s) for user`,
    };
  } catch (error) {
    console.error("Error in getUserDevices:", error);
    throw error;
  }
};
