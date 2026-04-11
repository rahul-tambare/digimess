const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.getAvailableMSPs = async (parameter) => {
  try {
    //let t = await sequelize.transaction();
    let query = `SELECT 
    A.MSP_ID,
    A.MSP_USRID,
    A.MSP_NAME,
    A.MSP_TYPE,
    A.MSP_CAPACITY,
    A.MSP_DELIVERY,
    A.MSP_BUS_STATUS,
    A.MSP_LSTRT_HRS,
    A.MSP_LEND_HRS,
    A.MSP_DSTRT_HRS,
    A.MSP_CATEGORY,
    A.MSP_DEND_HRS,
    A.DINE_IN,
    A.TAKE_AWAY,
    A.MSP_RATING,
    A.cuisines,
    A.Offer_1,
    A.Offer_2,
    A.Offer_3,
    A.MSP_Image,
    A.MSP_Image2,
    A.MSP_Image3,
    MIN(B.M_PRICE) AS MIN_M_PRICE,
    C.AD_LINE1,
    C.AD_LINE2,
    C.AD_CITY,
    C.AD_STATE,
    C.AD_PIN,
    C.AD_LAT,
    C.AD_LON,
    D.U_MOBILE
FROM
    TB_MSP A
        JOIN
    TB_MENU B ON A.MSP_ID = B.M_MSPID
        JOIN
    TB_MSP_ADDRESS C ON A.MSP_USRID = C.AD_USERID
        JOIN
    TB_USER D ON A.MSP_USRID = D.U_USERID
WHERE
    A.MSP_APPROVED = 1
GROUP BY 
    A.MSP_ID, A.MSP_USRID, A.MSP_NAME, A.MSP_TYPE,
    A.MSP_CAPACITY, A.MSP_DELIVERY, A.MSP_BUS_STATUS, A.MSP_LSTRT_HRS, 
    A.MSP_LEND_HRS, A.MSP_DSTRT_HRS, A.MSP_DEND_HRS, A.DINE_IN, A.TAKE_AWAY,
    A.MSP_RATING, A.cuisines, A.Offer_1, A.Offer_2, A.Offer_3, A.MSP_Image,A.MSP_Image2,A.MSP_Image3, A.MSP_CATEGORY,
    C.AD_LINE1, C.AD_LINE2, C.AD_CITY, C.AD_STATE, C.AD_PIN, 
    C.AD_LAT, C.AD_LON, D.U_MOBILE`;
    let results = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    if (
      (parameter.consLat ?? parameter.consLat === undefined) &&
      (parameter.consLon ?? parameter.consLon === undefined)
    ) {
      const reqData = {
        lat: parameter.consLat,
        lon: parameter.consLon,
        res: results,
      };
      await getGeoDistance(reqData);
      console.log("reqData.res =", reqData.res);
      return reqData.res;
    } else return results;
  } catch (error) {
    throw error;
  }
};

// const getGeoDistance = async (reqData) => {
//   const startLat = reqData.lat;
//   const startLon = reqData.lon;

//   await reqData.res.forEach(getEachGeoDistance);

//   // reqData.res = reqData.res
//   //   .map(getEachGeoDistance)
//   //   .filter(res => res.DIST < 1);

//   function getEachGeoDistance(res) {
//     const R = 6371; // Radius of the Earth in kilometers

//     const dLat = (res.AD_LAT - startLat) * (Math.PI / 180); // Convert degrees to radians
//     const dLon = (res.AD_LON - startLon) * (Math.PI / 180);

//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(startLat * (Math.PI / 180)) *
//         Math.cos(res.AD_LAT * (Math.PI / 180)) *
//         Math.sin(dLon / 2) *
//         Math.sin(dLon / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     const distance = R * c; // Distance in kilometers
//     res.DIST = distance.toFixed(2);
//   }
// };

const getGeoDistance = async (reqData) => {
  const startLat = reqData.lat;
  const startLon = reqData.lon;

  // Calculate distances
  await reqData.res.forEach(getEachGeoDistance);

  // Sort in ascending order of distance
  reqData.res.sort((a, b) => parseFloat(a.DIST) - parseFloat(b.DIST));

  function getEachGeoDistance(res) {
    const R = 6371; // Radius of the Earth in kilometers

    const dLat = (res.AD_LAT - startLat) * (Math.PI / 180); // Convert degrees to radians
    const dLon = (res.AD_LON - startLon) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(startLat * (Math.PI / 180)) *
        Math.cos(res.AD_LAT * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in kilometers
    res.DIST = distance.toFixed(2);
  }
};
