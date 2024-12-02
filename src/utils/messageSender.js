const axios = require('axios')
const otpGenerator = require('otp-generator')
const crypto = require('crypto')

const sendOTPMessage = async (number,message)=>{
    const url = `${process.env.SMS_URL}?key=${process.env.SMS_API_KEY}
    &campaign=${process.env.SMS_CAMPAIGN_ID}&routeid=${process.env.SMS_ROUTE_ID}&type=${process.env.SMS_TYPE}&contacts=${number}
    &senderid=${encodeURIComponent(process.env.SMS_SENDER_ID)}&msg=${encodeURIComponent(message)}
    &template_id=${process.env.SMS_TEMPLATE_ID}`;
    try {
        const response = await axios.get(url);
        return { success: 1, result: response.data };
    } catch (error) {
        return { success: 0, result: error.message };
    }
}

const generateOTP  = (number,dig = 6)=>{
    const otp = otpGenerator.generate(dig,{
        digits:true,
        lowerCaseAlphabets:false,
        upperCaseAlphabets:false,
        specialChars:false,
    })
    const ttl = 10 * 60 * 1000
    const expires = Date.now() + ttl
    const data = `${number}.${otp}.${expires}`
    const hash = crypto.createHmac("sha256", process.env.OTP_MESSAGE_SEC_KEY).update(data).digest("hex")
    const fullHash = `${hash}.${expires}`
    return {fullHash,otp}
}


const verifyOTP= async (number,hash,otp)=>{
    const [hashValue, expires] = hash.split(".")
    const now = Date.now()
    if (now > Number(expires)) return false
    let data = `${number}.${otp}.${expires}`
    let newCalculatedHash = crypto
      .createHmac("sha256", process.env.OTP_MESSAGE_SEC_KEY)
      .update(data)
      .digest("hex")
      
    if (newCalculatedHash === hashValue) {
      return true
    }
    return false
}

module.exports = {
    sendOTPMessage,
    generateOTP,
    verifyOTP
}




// const sendSMSWALAMessage = async (phoneNumber,message)=>{
//     const url = "http://sms.smswala.in/app/smsapi/index.php";
//   //  
//     const postData = {
//         key: "55F59BB718F6BB",
//     //    key: "262E0282E090BB",
//         campaign: "10397",
//         routeid: "30",
//         type: "text",
//         contacts: phoneNumber,
//         senderid: "FPSFPS",
//         msg: `FPSJOB - 123456 is your one time OTP for phone verification`
//     }
//     try {
//         const response = await axios.post(url, postData);
//         console.log(response);
//         return { success: 1, result: response.data };
//     } catch (error) {
//         return { success: 0, result: error.message };
//     }
// }


const sendSMSWALAMessage = async (phoneNumber, message) => {
    const baseUrl = "https://sms.k7marketinghub.com/app/smsapi/index.php";
   // const baseUrl = "http://sms.smswala.in/app/smsapi/index.php";
    const key = "262E0282E090BB";
    const campaign = "10397";
    const routeid = "30";
    const type = "text";
    const senderid = "RCERKE";
    const msg = `FPSJOB - 123456 is your one time OTP for phone verification`;
    const template_id = '1207161883393444775';

    const url = `${baseUrl}?key=${key}&campaign=${campaign}&routeid=${routeid}&type=${type}&contacts=${phoneNumber}&senderid=${encodeURIComponent(senderid)}&msg=${encodeURIComponent(msg)}&template_id=${template_id}`;
    try {
        const response = await axios.get(url);
        return { success: 1, result: response.data };
    } catch (error) {
        return { success: 0, result: error.message };
    }
}



const sendRPSMSMessage = async (req,res)=>{
    const authKey = "120408AXLEElMB58a42ef0";
    const mobileNumber = userDet.mobile;
    const senderId = "ABCSMS";
    const message = encodeURIComponent(`Congratulations! Your purchase for ${offDet.vendorname} option: ${offDet.off_title} is successful. Voucher Code: ${voucherCodeForMerchant}`);
    const route = 4;
    const url = "http://sms.rpsms.in/api/sendhttp.php";
    const postData = {
        authkey: authKey,
        mobiles: mobileNumber,
        message: message,
        sender: senderId,
        route: route
    };

    try {
        const response = await axios.post(url, postData);
        return { success: 1, result: response.data };
    } catch (error) {
        return { success: 0, result: error.message };
    }
}

// module.exports = {
//     sendSMSWALAMessage
// }

// "https://sms.k7marketinghub.com/app/smsapi/index.php?key=262E0282E090BB&campaign=10397&routeid=30&type=text&contacts=7976747422&senderid=RCERKE&msg=FPSJOB%20-%20839160%20is%20your%20one%20time%20OTP%20for%20phone%20verification&template_id=1207161883393444775",


// "smsResult": {
//     "success": 1,
//     "url": "https://sms.k7marketinghub.com/app/smsapi/index.php?key=262E0282E090BB&campaign=10397&routeid=30&type=text&contacts=7976747422&senderid=RCERKE&msg=FPSJOB%20-%20839160%20is%20your%20one%20time%20OTP%20for%20phone%20verification&template_id=1207161883393444775",
//     "result": "SMS-SHOOT-ID/FPSjobs65c9ea89bfa45"
//     }

// {
//     "status": "success",
//     "UID": 65534,
//     "mobile": "7976747422",
//     "smsResult": {
//     "success": 1,
//     "url": "https://sms.k7marketinghub.com/app/smsapi/index.php?key=262E0282E090BB&campaign=10397&routeid=30&type=text&contacts=7976747422&senderid=RCERKE&msg=FPSJOB%20-%20839160%20is%20your%20one%20time%20OTP%20for%20phone%20verification&template_id=1207161883393444775",
//     "result": "SMS-SHOOT-ID/FPSjobs65c9ea89bfa45"
//     }
    



// $msg = str_replace(" ", '%20', $message);
//         $url =  "http://sms.smswala.in/app/smsapi/index.php?key=55F59BB718F6BB&campaign=10397&routeid=30&type=text&contacts=".$mobileNumber."&senderid=FPSJOB&msg=".$msg."";
//         $ch = curl_init();
//         curl_setopt($ch, CURLOPT_URL, $url);
//         curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
//         $return = curl_exec ($ch);
//         if (curl_errno($ch)) {
//             $e = curl_errno($ch);
//             curl_close($ch);
//             //var_dump($e);die;
//             return array("success" => 0, "result" => $e);
//         } else {
//         curl_close($ch);
//             return array("success" => 1, 'result' => $return);
//         }



//         $key      = "55F59BB718F6BB";
//         $campaign =  "10397";
//         $routeid  =  "30";
//         $type     =  "text";
//         $contacts =  $mobileNumber;
//         $senderID =  "FPSFPS";
//         $msg      =  $message;
//         //Prepare you post parameters
//         $postData = array(
//                             'key' => $key,
//                             'campaign' => $campaign,
//                             'routeid' => $routeid,
//                             'type' => $type,
//                             'contacts' => $contacts,
//                             'senderid' => $senderID,
//                             'msg' => $msg
//                     );
//         $url = "http://sms.smswala.in/app/smsapi/index.php";
//         // init the resource
//         $ch = curl_init();
//         curl_setopt_array($ch, array(
//             CURLOPT_URL => $url,
//             CURLOPT_RETURNTRANSFER => true,
//             CURLOPT_POST => true,
//             CURLOPT_POSTFIELDS => $postData
//                 //,CURLOPT_FOLLOWLOCATION => true
//         ));
//         //Ignore SSL certificate verification
//         curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
//         curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
//         //get response
//         $result = curl_exec($ch);
//         //Print error if any
//         if (curl_errno($ch)) {
//             $e = curl_errno($ch);
//             curl_close($ch);
//             //var_dump($e);die;
//             return array("success" => 0, "result" => $e);
//         } else {
//             curl_close($ch);
//             return array("success" => 1, 'result' => $result);
//         }



//         $query = $this-> db->insert('tbl_monsters_transaction', $hist_values);
//         $authKey = "120408AXLEElMB58a42ef0";
//         $mobileNumber = $userDet->mobile ;
//         //Sender ID,While using route4 sender id should be 6 characters long.
//         $senderId = "ABCSMS";
//         //Your message to send, Add URL encoding here.
//         $message = urlencode("Congratulations! Your purchase for ".$offDet->vendorname ." option: ". $offDet->off_title ." is successful. Voucher Code: ".$voucher_code_for_merchant ." ");
//         //Define route
//         $route = 4;
//         //Prepare you post parameters
//         $postData = array(
//             'authkey' => $authKey,
//             'mobiles' => $userDet->mobile,
//             'message' => $message,
//             'sender' => $senderId,
//             'route' => $route
//         );
//         //API URL
//         $url="http://sms.rpsms.in/api/sendhttp.php";
//         // init the resource
//         $ch = curl_init();
//         curl_setopt_array($ch, array(
//             CURLOPT_URL => $url,
//             CURLOPT_RETURNTRANSFER => true,
//             CURLOPT_POST => true,
//             CURLOPT_POSTFIELDS => $postData
//             //,CURLOPT_FOLLOWLOCATION => true
//         ));
//         //Ignore SSL certificate verification
//         curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
//         curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
//         //get response
//         $output = curl_exec($ch);
//         //Print error if any
//         if(curl_errno($ch))
//         {
//             echo 'error:' . curl_error($ch);
//         }
//         curl_close($ch);



// $key      = "55F59BB718F6BB";
//         $campaign =  "10397";
//         $routeid  =  "30";
//         $type     =  "text";
//         $contacts =  $mobileNumber;
//         $senderID =  "FPSFPS";
//         $msg      =  $message;
//         //Prepare you post parameters
//         $postData = array(
//                             'key' => $key,
//                             'campaign' => $campaign,
//                             'routeid' => $routeid,
//                             'type' => $type,
//                             'contacts' => $contacts,
//                             'senderid' => $senderID,
//                             'msg' => $msg
//                     );
//         $url = "http://sms.smswala.in/app/smsapi/index.php";
//         // init the resource
//         $ch = curl_init();
//         curl_setopt_array($ch, array(
//             CURLOPT_URL => $url,
//             CURLOPT_RETURNTRANSFER => true,
//             CURLOPT_POST => true,
//             CURLOPT_POSTFIELDS => $postData
//                 //,CURLOPT_FOLLOWLOCATION => true
//         ));
//         //Ignore SSL certificate verification
//         curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
//         curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
//         //get response
//         $result = curl_exec($ch);
//         //Print error if any
//         if (curl_errno($ch)) {
//             $e = curl_errno($ch);
//             curl_close($ch);
//             //var_dump($e);die;
//             return array("success" => 0, "result" => $e);
//         } else {
//             curl_close($ch);
//             return array("success" => 1, 'result' => $result);
//         }


// $query = $this-> db->insert('tbl_monsters_transaction', $hist_values);
//                         $authKey = "120408AXLEElMB58a42ef0";
//                         $mobileNumber = $userDet->mobile ;
//                         //Sender ID,While using route4 sender id should be 6 characters long.
//                         $senderId = "ABCSMS";
//                         //Your message to send, Add URL encoding here.
//                         $message = urlencode("Congratulations! Your purchase for ".$offDet->vendorname ." option: ". $offDet->off_title ." is successful. Voucher Code: ".$voucher_code_for_merchant ." ");
//                         //Define route
//                         $route = 4;
//                         //Prepare you post parameters
//                         $postData = array(
//                             'authkey' => $authKey,
//                             'mobiles' => $userDet->mobile,
//                             'message' => $message,
//                             'sender' => $senderId,
//                             'route' => $route
//                         );
//                         //API URL
//                         $url="http://sms.rpsms.in/api/sendhttp.php";
//                         // init the resource
//                         $ch = curl_init();
//                         curl_setopt_array($ch, array(
//                             CURLOPT_URL => $url,
//                             CURLOPT_RETURNTRANSFER => true,
//                             CURLOPT_POST => true,
//                             CURLOPT_POSTFIELDS => $postData
//                             //,CURLOPT_FOLLOWLOCATION => true
//                         ));
//                         //Ignore SSL certificate verification
//                         curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
//                         curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
//                         //get response
//                         $output = curl_exec($ch);
//                         //Print error if any
//                         if(curl_errno($ch))
//                         {
//                             echo 'error:' . curl_error($ch);
//                         }
//                         curl_close($ch);