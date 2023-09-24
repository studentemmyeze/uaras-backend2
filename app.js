const express = require('express');
// https://medium.com/swlh/node-js-how-to-access-mysql-remotely-using-ssh-d45e21221039
const morgan = require('morgan');
// const bodyParser = require("body-parser");
const http = require('http');
const https = require('https');
const reader = require('xlsx')
const crypto = require('crypto')
const fileUpload = require('express-fileupload');
const mysql = require('mysql');
// const morgan = require('morgan')
const fetch = require('node-fetch');
var fs = require('fs');
const { type } = require('os');
require('dotenv/config');


const app = express();
app.listen(3000,()=> {
    console.log('server is running @ !');
})
// Middleware
app.use(express.json());
app.use(morgan('tiny'));


host = process.env.HOST;
user = process.env.USER;
password = process.env.PASSWORD;
database = process.env.DATABASE;
pythonUrl = process.env.PYTHONURL;
apiKey= process.env.APIKEY;
appSecret = process.env.APPSECRET;
tokenUrl = process.env.TOKENURL;
pushQualifiedUrl = process.env.PUSHQUALIFIEDURL;
type22 = '';
console.log("===========")
console.log("Done reading settings variables");
console.log("===========")
// passmark = 160

// ERROR CODES
// 200-
// 204-
tkMessage = ""
const dataListMain = []

// UTME - (RG_NUM,RG_CANDNAME,RG_SEX,STATE_NAME,RG_AGGREGATE,CO_NAME,LGA_NAME,Subject1,RG_Sub1Score,
//        Subject2,RG_Sub2Score,Subject3,RG_Sub3Score, EngScore)
// DE- (RG_NUM,RG_CANDNAME,RG_SEX,STATE_NAME,RG_AGGREGATE,CO_NAME,LGA_NAME)
// PRE- (RG_NUM,RG_CANDNAME,RG_AGGREGATE,PRE_NUM, SUBS,BO4,RG_SEX, STATE_NAME,CO_NAME,LGA_NAME, AVG )
// JUPEB- (RG_NUM,JUP_NUM,RG_CANDNAME,SUBS,TOT_SCO,FIRST_CO,SECOND_CO, REMK)
// SUP- (RG_NUM, PREF_CO,SOURCE)
// Excel format postUTME-(RG_NUM,RG_AGGREGATE,PU_AGGREGATE,CALC_AGGREGATE )

// const app = express();

var tempUTME = {"UTME":[], "DE":[], "PRE":[],"JUPEB":[],"SUP":[], "POSTUTME":[]};
const mainTableName = {
    "UTME":'uaras_utme_candidates',
    "DE":'uaras_de_candidates',
    "PRE":'uaras_prescience_candidates',
    "JUPEB":'uaras_jupeb_candidates',
    "SUP":'uaras_sup_candidates',
    "POSTUTME": 'uaras_putme_score',
    "UTMEREG": 'uaras_utme_reg',
    "POSTSTATUS": 'uaras_saved_utme_candidate_status'
}

const tempTableName = {
    "UTME":'uaras_temp_utme_candidates',
    "DE":'uaras_temp_de_candidates',
    "PRE":'uaras_temp_prescience_candidates',
    "JUPEB":'uaras_temp_jupeb_candidates',
    "SUP":'uaras_temp_sup_candidates',
    "POSTUTME": 'uaras_temp_putme_score',
    "PASSMK": 'uaras_utme_passmark'
}

const queryCreateTable = {
    "UTME":`(
    id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
    reg_num VARCHAR(30) NOT NULL COMMENT 'unique reg_num for each candidate ',
    fullname VARCHAR(255) NOT NULL COMMENT 'fullname of candidate',
    sex VARCHAR(30) NOT NULL COMMENT 'gender of candidate',
    state VARCHAR(50) NOT NULL COMMENT 'candidate state of origin',
    utme_aggregate INT NOT NULL COMMENT 'candidate aggregate score',
    department VARCHAR(255) NOT NULL COMMENT 'department of choice',
    lga VARCHAR(255) NOT NULL COMMENT 'candidate lga of origin',
    subject_1 VARCHAR(255) NOT NULL COMMENT 'subject combination one',
    subject_1_score INT NOT NULL COMMENT 'subject one score',
    subject_2 VARCHAR(255) NOT NULL COMMENT 'subject combination two',
    subject_2_score INT NOT NULL COMMENT 'subject two score',
    subject_3 VARCHAR(255) NOT NULL COMMENT 'subject combination three',
    subject_3_score INT NOT NULL COMMENT 'subject three score',
    english_score INT NOT NULL COMMENT 'english score',
    phone VARCHAR(255) DEFAULT NULL COMMENT 'phone number of candidate',
    email VARCHAR(255) DEFAULT NULL COMMENT 'email of candidate',
    password TEXT DEFAULT NULL COMMENT 'password of candidate',
    bio_data TEXT DEFAULT NULL COMMENT 'bio data of candidate',

    edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (reg_num)
) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for UTME Candidates'`,

    "DE":`(
    id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
    reg_num VARCHAR(30) NOT NULL COMMENT 'unique reg_num for each candidate',
    fullname VARCHAR(255) NOT NULL COMMENT 'fullname of candidate',
    sex VARCHAR(30) NOT NULL COMMENT 'gender of candidate',
    state VARCHAR(50) NOT NULL COMMENT 'candidate state of origin',
    department VARCHAR(255) NOT NULL COMMENT 'This is the department of choice',
    lga VARCHAR(255) NOT NULL COMMENT 'candidate lga of origin',
    phone VARCHAR(255) NOT NULL COMMENT 'phone number of candidate',
    email VARCHAR(255) NOT NULL COMMENT 'email of candidate',
    bio_data JSON NOT NULL COMMENT 'bio data of candidate',
    added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (reg_num)
) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for DE Candidates'`,

    "PRE":`(
    id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
    reg_num VARCHAR(30) NOT NULL COMMENT 'unique reg_num for each candidate',
    fullname VARCHAR(255) NOT NULL COMMENT 'fullname of candidate',
    jamb_score INT NOT NULL COMMENT 'this is candidate jamb score',
    prescience_no VARCHAR(30) NOT NULL COMMENT 'this is candidate prescience number',
    subjects JSON NOT NULL COMMENT 'candidate chosen subjects',
    best_of_four VARCHAR(255) NOT NULL COMMENT 'best of four subjects',
    sex VARCHAR(30) NOT NULL COMMENT 'gender of candidate',
    state VARCHAR(50) NOT NULL COMMENT 'candidate state of origin',
    department_admitted VARCHAR(255) NOT NULL COMMENT 'candidate admitted department',
    average INT NOT NULL COMMENT 'this is the average score',
    phone VARCHAR(255) NOT NULL COMMENT 'phone number of candidate',
    email VARCHAR(255) NOT NULL COMMENT 'email of candidate',
    bio_data JSON NOT NULL COMMENT 'bio data of candidate',
    added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (prescience_no),
    UNIQUE (reg_num),
    UNIQUE (id)
) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for prescience Candidates'`,

    "JUPEB":`(
    id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
    reg_num VARCHAR(30) NOT NULL COMMENT 'the unique registration number for each candidate ',
    jupeb_no VARCHAR(30) NOT NULL COMMENT 'this is candidate jupeb number',
    fullname VARCHAR(255) NOT NULL COMMENT 'full name of candidate',
    subjects JSON NOT NULL COMMENT 'candidate chosen subjects',
    total score INT NOT NULL COMMENT 'the total score of candidate',
    first_choice VARCHAR(255) NOT NULL COMMENT 'first choice of candidate',
    second_choice VARCHAR(255) NOT NULL COMMENT 'second choice of candidate',
    remarks TEXT NOT NULL COMMENT 'general remarks',
    bio_data JSON NOT NULL COMMENT 'bio data of candidate',
    added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (jupeb_no),
    UNIQUE (reg_num),
    UNIQUE (id)
) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for JUPEB Candidates'`,

    "SUP":`(
    id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
    reg_num VARCHAR(30) NOT NULL COMMENT 'the unique registration number for each candidate',
    preferred_course VARCHAR(255) NOT NULL COMMENT 'this is the preferred course of candidate',
    source VARCHAR(255) NOT NULL COMMENT 'source',
    added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (reg_num)
) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for supplementary Candidates'`,

    "POSTUTME": `(
    id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
    reg_num VARCHAR(30) NOT NULL COMMENT 'the unique registration number for each candidate',
    utme_score INT NOT NULL COMMENT 'the utme score of candidate',
    putme_score INT NOT NULL COMMENT 'the putme score of candidate',
    calculated_average INT NOT NULL COMMENT 'the calculated average score of candidate',
    added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (reg_num)
) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for putme_score'`

}



// push data
const pushParams = {"UTME":[], "DE":[], "PRE":[],"JUPEB":[],"SUP":[], "POSTUTME":[], "SAVEUTMESTATUS": []};
const pushDataTotal2Push = {"UTME":[], "DE":[], "PRE":[],"JUPEB":[],"SUP":[], "POSTUTME":[], "SAVEUTMESTATUS": []};
const pushStatus = {"UTME":'ready', "DE":'ready', "PRE":'ready',"JUPEB":'ready',"SUP":'ready', "POSTUTME":'ready', "SAVEUTMESTATUS": ""};
const pushStatusMessage = {"UTME":'', "DE":'', "PRE":'',"JUPEB":'',"SUP":'', "POSTUTME":'', "SAVEUTMESTATUS": ""};
const pushTime_taken_string = {"UTME":'', "DE":'', "PRE":'',"JUPEB":'',"SUP":'', "POSTUTME":'', "SAVEUTMESTATUS": []};
const pushDate_start = {"UTME":new Date(), "DE":new Date(), "PRE":new Date(),"JUPEB":new Date(),"SUP":new Date(), "POSTUTME":new Date()};
const pushDataProcessed = {"UTME":[], "DE":[], "PRE":[],"JUPEB":[],"SUP":[], "POSTUTME":[], "SAVEUTMESTATUS": []};

const pushDataNotSaved = {"UTME":[], "DE":[], "PRE":[],"JUPEB":[],"SUP":[], "POSTUTME":[]};


const pushDataNotProcessed = {"UTME":[], "DE":[], "PRE":[],"JUPEB":[],"SUP":[], "POSTUTME":[], "SAVEUTMESTATUS": []};
const successBatchCount = {"UTME":0, "DE":0, "PRE":0,"JUPEB":0,"SUP":0, "POSTUTME":0, "SAVEUTMESTATUS": 0};

// upload stats
const uploadStatus = {"UTME":'ready', "DE":'ready', "PRE":'ready',"JUPEB":'ready',"SUP":'ready', "POSTUTME":'ready', "SAVEUTMESTATUS": ""};
const uploadStatusMessage = {"UTME":'', "DE":'', "PRE":'',"JUPEB":'',"SUP":'', "POSTUTME":'', "SAVEUTMESTATUS": ""};

const tempDataReceived = {"UTME":[], "DE":[], "PRE":[],"JUPEB":[],"SUP":[], "POSTUTME":[], "SAVEUTMESTATUS": []};
const tempDataMovedToMain = {"UTME":[], "DE":[], "PRE":[],"JUPEB":[],"SUP":[], "POSTUTME":[], "SAVEUTMESTATUS": []};
const updatedData = {"UTME":[], "DE":[], "PRE":[],"JUPEB":[],"SUP":[], "POSTUTME":[], "SAVEUTMESTATUS": []};
const totalTempDataProcessed = {"UTME":[], "DE":[], "PRE":[],"JUPEB":[],"SUP":[], "POSTUTME":[], "SAVEUTMESTATUS": []};
const dataNotProcessed = {"UTME":[], "DE":[], "PRE":[],"JUPEB":[],"SUP":[], "POSTUTME":[], "SAVEUTMESTATUS": []};
const time_taken_string = {"UTME":'', "DE":'', "PRE":'',"JUPEB":'',"SUP":'', "POSTUTME":'', "SAVEUTMESTATUS": []};
const date_start = {"UTME":new Date(), "DE":new Date(), "PRE":new Date(),"JUPEB":new Date(),"SUP":new Date(), 
                    "POSTUTME":new Date()};
                    // 'PushUTME': new Date(), 'PushDE': new Date()};

// try {
//   var data = fs.readFileSync('settings.txt', 'utf8');
//   const dataList = data.toString().split('\r\n');
//   for (a in dataList) {
//     dataListMain.push(a)
//   }
//   host = dataList[0].toString();
//   user = dataList[1].toString();
//   password = dataList[2].toString();
//   database = dataList[3].toString();
//   pythonUrl = dataList[4].toString();
//   apiKey = dataList[5].toString();
//   appSecret = dataList[6].toString();
//   tokenUrl = dataList[7].toString();
//   pushQualifiedUrl = dataList[8].toString();
//   console.log("===========")
//   console.log("Done reading settings variables");
//   console.log("===========")

// }
// catch(e) {
//   console.log('Error:', e.stack);
// }

var isConnectedToDB = false
var lastOpStat = {}

const connection = mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database
});
// make the connection and other settings configurable in a txt config file



async function makeConnection() {
    if (!isConnectedToDB) {
        connection.connect(function(err) {
        
            if (err) {
                return console.error('error: ' + err.message);
            }
    
            console.log('Connected to the MySQL server.');
            isConnectedToDB = true;
        });
    }
    
}

async function closeConnection() {
    if (isConnectedToDB) {
        connection.end(function(err) {
            if (err) {
                return console.log('error:' + err.message);
            }
            console.log('Close the database connection.');
            isConnectedToDB = false;
        });

    }
    
}


function waitforme(ms)  {
    return new Promise( resolve => { setTimeout(resolve, ms); });
}

async function updateStudentRecordSave(type,tableName,toSendSample) {
    let queryTemp = ''
    if (type === "SAVEUTMESTATUS") {
        queryTemp = `UPDATE ${tableName}
    SET department = '${await checkForApostro((toSendSample.department).toString())}', school = '${(toSendSample.school).toString()}', recommendation  = '${toSendSample.recommendation}',
    qualified = ${toSendSample.qualified} WHERE reg_num = '${toSendSample.reg_num}';`;
    }

    // console.log("update query::", queryTemp)

    await doQuery(queryTemp)
}



async function updateStudentRecord(type,tableName,i, schoolType='') {
    var queryTemp = ""


    // if (type === 'UTME' && type22 !== '') {
    //   queryTemp = `INSERT INTO ${tableName} (
    //     reg_num, fullname, sex, state, utme_aggregate, department, lga, subject_1, subject_1_score, subject_2,
    //     subject_2_score, subject_3, subject_3_score, english_score, phone)

    //   VALUES ('${tempUTME[type][i].RG_NUM}', '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}','${tempUTME[type][i].SEX}', '${await checkForApostro(tempUTME[type][i].STATE_NAME)}',
    //   ${tempUTME[type][i].RG_AGGREGATE},
    //   '${await checkForApostro(tempUTME[type][i].CO_NAME)}', '${await checkForApostro(tempUTME[type][i].LGA_NAME)}', '${tempUTME[type][i].Subject1}', ${tempUTME[type][i].RG_Sub1Score},
    //   '${tempUTME[type][i].Subject2}', ${tempUTME[type][i].RG_Sub2Score}, '${tempUTME[type][i].Subject3}', ${tempUTME[type][i].RG_Sub3Score},
    //   ${tempUTME[type][i].EngScore}, '${type22}')`
    // }


    if (type === "UTME" && schoolType !== '') {
        queryTemp = `UPDATE ${tableName}
    SET fullname = '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}',
    sex = '${tempUTME[type][i].RG_SEX}',
    state = '${await checkForApostro(tempUTME[type][i].STATE_NAME)}',
    utme_aggregate = ${tempUTME[type][i].RG_AGGREGATE},
    department = '${await checkForApostro(tempUTME[type][i].CO_NAME)}',
    lga = '${await checkForApostro(tempUTME[type][i].LGA_NAME)}', subject_1 = '${tempUTME[type][i].Subject1}',
    subject_1_score = ${tempUTME[type][i].RG_Sub1Score}, phone='${type22}',
    subject_2 = '${tempUTME[type][i].Subject2}', subject_2_score = ${tempUTME[type][i].RG_Sub2Score},
    subject_3 = '${tempUTME[type][i].Subject3}', subject_3_score = ${tempUTME[type][i].RG_Sub3Score},
    english_score = ${tempUTME[type][i].EngScore} WHERE reg_num = '${tempUTME[type][i].RG_NUM}';`;

    }


    else if (type === "UTME") {
        queryTemp = `UPDATE ${tableName}
    SET fullname = '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}',
    sex = '${tempUTME[type][i].RG_SEX}',
    state = '${await checkForApostro(tempUTME[type][i].STATE_NAME)}',
    utme_aggregate = ${tempUTME[type][i].RG_AGGREGATE},
    department = '${await checkForApostro(tempUTME[type][i].CO_NAME)}',
    lga = '${await checkForApostro(tempUTME[type][i].LGA_NAME)}', subject_1 = '${tempUTME[type][i].Subject1}',
    subject_1_score = ${tempUTME[type][i].RG_Sub1Score},
    subject_2 = '${tempUTME[type][i].Subject2}', subject_2_score = ${tempUTME[type][i].RG_Sub2Score},
    subject_3 = '${tempUTME[type][i].Subject3}', subject_3_score = ${tempUTME[type][i].RG_Sub3Score},
    english_score = ${tempUTME[type][i].EngScore} WHERE reg_num = '${tempUTME[type][i].RG_NUM}';`;

    }





    else if (type === "DE") {
        queryTemp = `UPDATE ${tableName}
    SET fullname = '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}',
    sex = '${tempUTME[type][i].RG_SEX}',
    state = '${await checkForApostro(tempUTME[type][i].STATE_NAME)}',

    department = '${await checkForApostro(tempUTME[type][i].CO_NAME)}',
    lga = '${await checkForApostro(tempUTME[type][i].LGA)}'
    WHERE reg_num = '${tempUTME[type][i].RG_NUM}'`;


    }

    else if (type === "PRE") {
        queryTemp = `UPDATE ${tableName}
    SET fullname = '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}',
    jamb_score = ${tempUTME[type][i].RG_AGGREGATE},
    prescience_no = '${tempUTME[type][i].PRE_NUM}',
    subjects = ${tempUTME[type][i].SUBS},
    best_of_four = '${tempUTME[type][i].BO4}',
    sex = '${tempUTME[type][i].RG_SEX}',
    state = '${await checkForApostro(tempUTME[type][i].STATE_NAME)}',
    department_admitted = '${await checkForApostro(tempUTME[type][i].CO_NAME)}',
    lga = '${await checkForApostro(tempUTME[type][i].LGA_NAME)}'
    average = ${tempUTME[type][i].AVG}
    WHERE reg_num = '${tempUTME[type][i].RG_NUM}'`;
    }
    else if (type === "JUPEB") {
        queryTemp = `UPDATE ${tableName}
    SET
    jupeb_no = '${tempUTME[type][i].JUP_NUM}',
    fullname = '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}',
    subjects = ${tempUTME[type][i].SUBS},
    total_score = ${tempUTME[type][i].TOT_SCO},
    first_choice = '${tempUTME[type][i].FIRST_CO}',
    second_choice = '${tempUTME[type][i].SECOND_CO}',
    remarks = '${await checkForApostro(tempUTME[type][i].REMK)}'
    WHERE reg_num = '${tempUTME[type][i].RG_NUM}'`;

    }



    else if (type === "SUP") {

        queryTemp = `UPDATE ${tableName}
    SET
    preferred_course = '${tempUTME[type][i].PREF_CO}',
    source =  '${await checkForApostro(tempUTME[type][i].SOURCE)}'

    WHERE reg_num = '${tempUTME[type][i].RG_NUM}'`;
    }

    else if (type === "POSTUTME") {
        queryTemp = `UPDATE ${tableName}
    SET
    utme_score = ${tempUTME[type][i].RG_AGGREGATE},
    putme_score = ${tempUTME[type][i].PU_AGGREGATE},
    calculated_average = ${tempUTME[type][i].CALC_AGGREGATE}
    WHERE reg_num = '${tempUTME[type][i].RG_NUM}'`;
    }

    await doQuery(queryTemp)
}

async function updateStudentRecord_Registrations(type,tableName, record) {
    var queryTemp = ""
    if (type === "UTME") {
        queryTemp = `UPDATE ${tableName}
    SET
    phone = '${await checkForApostro(record.phone)}',
    email = '${await checkForApostro(record.email)}',
    password = '${await checkForApostro(record.password)}'
    WHERE reg_num = '${record.reg_num}'`;

    }
    else if (type === "DE") {
        queryTemp = `UPDATE ${tableName}
    SET fullname = '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}',
    sex = '${tempUTME[type][i].RG_SEX}',
    state = '${await checkForApostro(tempUTME[type][i].STATE_NAME)}',

    department = '${await checkForApostro(tempUTME[type][i].CO_NAME)}',
    lga = '${await checkForApostro(tempUTME[type][i].LGA)}'
    WHERE reg_num = '${tempUTME[type][i].RG_NUM}'`;


    }

    else if (type === "PRE") {
        queryTemp = `UPDATE ${tableName}
    SET fullname = '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}',
    jamb_score = ${tempUTME[type][i].RG_AGGREGATE},
    prescience_no = '${tempUTME[type][i].PRE_NUM}',
    subjects = ${tempUTME[type][i].SUBS},
    best_of_four = '${tempUTME[type][i].BO4}',
    sex = '${tempUTME[type][i].RG_SEX}',
    state = '${await checkForApostro(tempUTME[type][i].STATE_NAME)}',
    department_admitted = '${await checkForApostro(tempUTME[type][i].CO_NAME)}',
    lga = '${await checkForApostro(tempUTME[type][i].LGA_NAME)}'
    average = ${tempUTME[type][i].AVG}
    WHERE reg_num = '${tempUTME[type][i].RG_NUM}'`;
    }
    else if (type === "JUPEB") {
        queryTemp = `UPDATE ${tableName}
    SET
    jupeb_no = '${tempUTME[type][i].JUP_NUM}',
    fullname = '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}',
    subjects = ${tempUTME[type][i].SUBS},
    total_score = ${tempUTME[type][i].TOT_SCO},
    first_choice = '${tempUTME[type][i].FIRST_CO}',
    second_choice = '${tempUTME[type][i].SECOND_CO}',
    remarks = '${await checkForApostro(tempUTME[type][i].REMK)}'
    WHERE reg_num = '${tempUTME[type][i].RG_NUM}'`;

    }



    else if (type ==="SUP") {

        queryTemp = `UPDATE ${tableName}
    SET
    preferred_course = '${tempUTME[type][i].PREF_CO}',
    source =  '${await checkForApostro(tempUTME[type][i].SOURCE)}'

    WHERE reg_num = '${tempUTME[type][i].RG_NUM}'`;
    }

    else if (type === "POSTUTME") {
        queryTemp = `UPDATE ${tableName}
    SET
    utme_score = ${tempUTME[type][i].RG_AGGREGATE},
    putme_score = ${tempUTME[type][i].PU_AGGREGATE},
    calculated_average = ${tempUTME[type][i].CALC_AGGREGATE}
    WHERE reg_num = '${tempUTME[type][i].RG_NUM}'`;
    }

    await doQuery(queryTemp)
}

async function matchUTMECandidateHashSaved(type,tableName, toSendSample, phone) {
    try {
        // reg_num, department, school, student_type, recommendation, qualified
        // console.log('at saved::', toSendSample)
        const r1 = await recordsFromATableGrab(type,toSendSample.reg_num, tableName)

        // atype2 ==="1" ? "UMUNZE" :
        //           (atype2 ==="2" ? "AUCHI":(atype2 ==="3" ? "POPE JOHN" : "ESCET"))
        //           type2 = toSend[0]['phone'] ? toSend[0]['phone'] : 0
        // console.log('r1::', r1)
        // console.log('r1[0]::', r1[0])
        // console.log('this is phone::', (phone))
        // console.log('this is phone function::', isNullOrUndefined(phone))


        if (r1.length > 0) {
            // const recommendObj = JSON.parse(toSendSample.recommendation)

            let School = "";
            try {
                if (!isNullOrUndefined(phone) && phone !== '' && phone !== ' ' && phone !== 0 && phone !== '0'){
                    if (phone.toString() ==="1") {School = "UMUNZE" }
                    if (phone.toString() ==="2") {School = "AUCHI" }
                    if (phone.toString() ==="3") {School = "POPE JOHN" }
                    if (phone.toString() ==="4") {School = "ESCET" }
                }
                else {School = 'UNIZIK'}
            }
            catch {School = 'UNIZIK'}


            const newJSON =
                {reg_num: toSendSample.reg_num , department: toSendSample.department,

                    // school: recommendObj.Info ? recommendObj.Info : 'UNIZIK',
                         school: School ,
                    student_type: toSendSample.student_type,
                    recommendation: toSendSample.recommendation, qualified: toSendSample.qualified}
                    // try {
                    //     const newnewJSON =
                    // {reg_num: toSendSample['reg_num'] , department: toSendSample['department'],
    
                    //     school: (toSendSample['phone'] ? (
                    //         (toSendSample['phone']).toString() ==="1" ? "UMUNZE" :
                    //             ((toSendSample['phone']).toString()  ==="2" ? "AUCHI":(t(toSendSample['phone']).toString()  ==="3" ? "POPE JOHN" : "ESCET"))) : 'UNIZIK' ) ,
                    //     student_type: toSendSample['student_type'],
                    //     recommendation: toSendSample['recommendation'], qualified: toSendSample['qualified']}
                    //     console.log("newnewJSON from MainUTMETable",newnewJSON)
                    // } catch (error) {
                    //     console.log('newnew',error)
                    // }
            

            const h1 = crypto.createHash('sha1').update(`${JSON.stringify(newJSON)}`).digest('hex')
            const h2 = crypto.createHash('sha1').update(`${JSON.stringify(r1[0])}`).digest('hex')


            // console.log("r1 from SavedTable::",r1[0])
            // console.log("newJSON from to save",newJSON)
            // console.log('this is phone::', (phone))
            // console.log('this is phone to string::', (phone).toString())

            if (h1 !== h2) {
                console.log("not equal- will save newJSON")
                await updateStudentRecordSave(type,tableName,newJSON)
            }
            // reg_num, department, school, student_type, recommendation, qualified

        }
        else {
            try {
                // console.log('What we want to save::', toSendSample)
                await addRecord2(type,tableName,toSendSample, phone)
                updatedData[type].push(toSendSample.reg_num)
            } catch (error) {
                dataNotProcessed[type].push(toSendSample.reg_num)
                console.log("error saving UTME status")
            }
        }

    }
    catch {console.log('error saving this', toSendSample)}


}



async function matchUTMECandidateHash(type,tableName, tempTableName, schoolType='') {
    // console.log('checking hash')
    for (let i = 0; i < tempUTME[type].length; i++) {
        // for (let i = 0; i < 25; i++) {

        const r1 = await recordsFromATableGrab(type,tempUTME[type][i].RG_NUM, tableName)
        // console.log('..record grabbed ', r1)
        if (r1.length > 0) { // the record has been entered into the main table before
            const r2 = await recordsFromATableGrab(type,tempUTME[type][i].RG_NUM, tempTableName)
            const h1 = crypto.createHash('sha1').update(`${JSON.stringify(r1[0])}`).digest('hex')
            const h2 = crypto.createHash('sha1').update(`${JSON.stringify(r2[0])}`).digest('hex')
            if (h1 !== h2) {
                try {
                    await updateStudentRecord(type,tableName, i, schoolType)
                    updatedData[type].push(tempUTME[type][i])
                } catch (error) {
                    dataNotProcessed[type].push(tempUTME[type][i])
                }

            }
        }

        else { // this is a new record
            try {
                await addRecord(type,tableName, i, schoolType)
                tempDataMovedToMain[type].push(tempUTME[type][i])
            } catch (error) {
                dataNotProcessed[type].push(tempUTME[type][i])
            }

        }
        totalTempDataProcessed[type].push(tempUTME[type][i])



    }

    return 1
}


// utilities

async function checkTableExists(tableName) {
    console.log(`@...CHECK ${tableName} TABLE EXISTS`)
    var database = 'uaras'
    var sql = `
  SHOW TABLE STATUS
  FROM ${database}
  WHERE Name = '${tableName}';`

    var result = 0
    try {
        tempResult = await doQuery(sql)
        if (tempResult.length > 0) {result = 1}

    } catch (error) {
        result = 0
    }

    return result
}

async function createTable(type, tableName) {


    var sql = ""
    if (type==="UTME") {
        sql = `
    CREATE TABLE ${tableName} (
      id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
      reg_num VARCHAR(30) NOT NULL COMMENT 'unique reg_num for each candidate ',
      fullname VARCHAR(255) NOT NULL COMMENT 'fullname of candidate',
      sex VARCHAR(30) NOT NULL COMMENT 'gender of candidate',
      state VARCHAR(50) NOT NULL COMMENT 'candidate state of origin',
      utme_aggregate INT NOT NULL COMMENT 'candidate aggregate score',
      department VARCHAR(255) NOT NULL COMMENT 'department of choice',
      lga VARCHAR(255) NOT NULL COMMENT 'candidate lga of origin',
      subject_1 VARCHAR(255) NOT NULL COMMENT 'subject combination one',
      subject_1_score INT NOT NULL COMMENT 'subject one score',
      subject_2 VARCHAR(255) NOT NULL COMMENT 'subject combination two',
      subject_2_score INT NOT NULL COMMENT 'subject two score',
      subject_3 VARCHAR(255) NOT NULL COMMENT 'subject combination three',
      subject_3_score INT NOT NULL COMMENT 'subject three score',
      english_score INT NOT NULL COMMENT 'english score',
      phone VARCHAR(255) DEFAULT NULL COMMENT 'phone number of candidate',
      email VARCHAR(255) DEFAULT NULL COMMENT 'email of candidate',
      password TEXT DEFAULT NULL COMMENT 'password of candidate',
      bio_data TEXT DEFAULT NULL COMMENT 'bio data of candidate',

      edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE (reg_num)
  ) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for UTME Candidates'`
    }

    else if (type==="DE") {

        sql = `CREATE TABLE ${tableName} (
        id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
        reg_num VARCHAR(30) NOT NULL COMMENT 'unique reg_num for each candidate',
        fullname VARCHAR(255) NOT NULL COMMENT 'fullname of candidate',
        sex VARCHAR(30) NOT NULL COMMENT 'gender of candidate',
        state VARCHAR(50) NOT NULL COMMENT 'candidate state of origin',
        department VARCHAR(255) NOT NULL COMMENT 'This is the department of choice',
        lga VARCHAR(255) NOT NULL COMMENT 'candidate lga of origin',
        phone VARCHAR(255) DEFAULT NULL COMMENT 'phone number of candidate',
        email VARCHAR(255) DEFAULT NULL COMMENT 'email of candidate',
        bio_data JSON DEFAULT NULL COMMENT 'bio data of candidate',
        added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE (reg_num)
    ) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for DE Candidates';`
    }

    else if (type==="PRE") {
        sql = `CREATE TABLE ${tableName} (
        id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
        reg_num VARCHAR(30) NOT NULL COMMENT 'unique reg_num for each candidate',
        fullname VARCHAR(255) NOT NULL COMMENT 'fullname of candidate',
        jamb_score INT NOT NULL COMMENT 'this is candidate jamb score',
        prescience_no VARCHAR(30) NOT NULL COMMENT 'this is candidate prescience number',
        subjects JSON NOT NULL COMMENT 'candidate chosen subjects',
        best_of_four VARCHAR(255) NOT NULL COMMENT 'best of four subjects',
        sex VARCHAR(30) NOT NULL COMMENT 'gender of candidate',
        state VARCHAR(50) NOT NULL COMMENT 'candidate state of origin',
        department_admitted VARCHAR(255) NOT NULL COMMENT 'candidate admitted department',
        average INT NOT NULL COMMENT 'this is the average score',
        phone VARCHAR(255) NOT NULL COMMENT 'phone number of candidate',
        email VARCHAR(255) NOT NULL COMMENT 'email of candidate',
        bio_data JSON NOT NULL COMMENT 'bio data of candidate',
        added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (prescience_no),
        UNIQUE (reg_num),
        UNIQUE (id)
    ) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for prescience Candidates';`
    }

    else if (type==="JUPEB") {

        sql = `
      CREATE TABLE ${tableName} (
          id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
          reg_num VARCHAR(30) NOT NULL COMMENT 'the unique registration number for each candidate ',
          jupeb_no VARCHAR(30) NOT NULL COMMENT 'this is candidate jupeb number',
          fullname VARCHAR(255) NOT NULL COMMENT 'full name of candidate',
          subjects JSON NOT NULL COMMENT 'candidate chosen subjects',
          total_score INT NOT NULL COMMENT 'the total score of candidate',
          first_choice VARCHAR(255) NOT NULL COMMENT 'first choice of candidate',
          second_choice VARCHAR(255) NOT NULL COMMENT 'second choice of candidate',
          remarks TEXT NOT NULL COMMENT 'general remarks',
          bio_data JSON NOT NULL COMMENT 'bio data of candidate',
          added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (jupeb_no),
          UNIQUE (reg_num),
          UNIQUE (id)
      ) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for JUPEB Candidates';`

    }

    else if (type==="SUP") {
        sql = `CREATE TABLE ${tableName} (
        id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
        reg_num VARCHAR(30) NOT NULL COMMENT 'the unique registration number for each candidate',
        preferred_course VARCHAR(255) NOT NULL COMMENT 'this is the preferred course of candidate',
        source VARCHAR(255) NOT NULL COMMENT 'source',
        added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE (reg_num)
    ) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for supplementary Candidates';`

    }

    else if (type === "POSTUTME") {
        sql = `CREATE TABLE  ${tableName} (
        id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
        reg_num VARCHAR(30) NOT NULL COMMENT 'the unique registration number for each candidate',
        utme_score INT NOT NULL COMMENT 'the utme score of candidate',
        putme_score INT NOT NULL COMMENT 'the putme score of candidate',
        calculated_average INT NOT NULL COMMENT 'the calculated average score of candidate',
        added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE (reg_num)
    ) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for putme_score';`


    }

    else if (type === "UTMEREG") {
        sql = `
    CREATE TABLE ${tableName} (
      id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
      reg_num VARCHAR(30) NOT NULL COMMENT 'unique reg_num for each candidate ',
      lastName VARCHAR(255) NOT NULL COMMENT 'lastname of candidate',
      firstName VARCHAR(255) NOT NULL COMMENT 'firstname of candidate',
      middleName VARCHAR(255) DEFAULT NULL COMMENT 'middlename of candidate',
      sex VARCHAR(30) NOT NULL COMMENT 'gender of candidate',
      state VARCHAR(50) NOT NULL COMMENT 'candidate state of origin',
      utme_aggregate INT NOT NULL COMMENT 'candidate aggregate score',
      department VARCHAR(255) NOT NULL COMMENT 'department of choice',
      lga VARCHAR(255) NOT NULL COMMENT 'candidate lga of origin',
      subject_1 VARCHAR(255) NOT NULL COMMENT 'subject combination one',
      subject_1_score INT NOT NULL COMMENT 'subject one score',
      subject_2 VARCHAR(255) NOT NULL COMMENT 'subject combination two',
      subject_2_score INT NOT NULL COMMENT 'subject two score',
      subject_3 VARCHAR(255) NOT NULL COMMENT 'subject combination three',
      subject_3_score INT NOT NULL COMMENT 'subject three score',
      english_score INT NOT NULL COMMENT 'english score',
      phone VARCHAR(255) DEFAULT NULL COMMENT 'phone number of candidate',
      email VARCHAR(255) DEFAULT NULL COMMENT 'email of candidate',

      edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE (reg_num)
      ) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for UTME Candidates that have passed the cutoff'`

    }

    else if (type === "PASSMK") {
        sql = `
    CREATE TABLE ${tableName} (

        id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
        passmark  INT DEFAULT 0 COMMENT 'passmark for all UTME',
        year VARCHAR(10) NOT NULL COMMENT 'academic year passmark was set for',
        current TINYINT(1) DEFAULT 0 COMMENT 'marker for if this is the current passmark to be looked at',
        edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE (year)
        ) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for PASSMARK';`


    }

    if (type === "SAVEUTMESTATUS") {
        sql = `
    CREATE TABLE ${tableName} (
      id INT NOT NULL AUTO_INCREMENT COMMENT 'unique ID for each candidate',
      reg_num VARCHAR(30) NOT NULL COMMENT 'unique reg_num for each candidate ',
      lastname VARCHAR(255) NOT NULL COMMENT 'lastname of candidate',
      firstname VARCHAR(255) NOT NULL COMMENT 'firstname of candidate',
      middlename VARCHAR(255) NOT NULL COMMENT 'lastname of candidate',


      sex VARCHAR(30) NOT NULL COMMENT 'gender of candidate',
      state VARCHAR(50) NOT NULL COMMENT 'candidate state of origin',
      utme_aggregate INT NOT NULL COMMENT 'candidate aggregate score',
      department VARCHAR(255) NOT NULL COMMENT 'department of choice',
      faculty VARCHAR(255) NOT NULL COMMENT 'faculty of choice',
      lga VARCHAR(255) NOT NULL COMMENT 'candidate lga of origin',
      subject_1 VARCHAR(255) NOT NULL COMMENT 'subject combination one',
      subject_1_score INT NOT NULL COMMENT 'subject one score',
      subject_2 VARCHAR(255) NOT NULL COMMENT 'subject combination two',
      subject_2_score INT NOT NULL COMMENT 'subject two score',
      subject_3 VARCHAR(255) NOT NULL COMMENT 'subject combination three',
      subject_3_score INT NOT NULL COMMENT 'subject three score',
      english_score INT NOT NULL COMMENT 'english score',
      school VARCHAR(255) DEFAULT NULL COMMENT 'school of candidate',
      student_type INT NOT NULL COMMENT 'student type utme or de 1 or 2',
      recommendation MEDIUMTEXT DEFAULT NULL COMMENT 'recommendation for candidate',

      qualified INT NOT NULL COMMENT '1 for yes 0 for no',


      edited TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE (reg_num)
  ) ENGINE = InnoDB CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT = 'This table is for saving UTME Candidates Status'`
    }


    // const result = await doQuery(sql)
    // return result

    var result = 1
    try {
        await doQuery(sql)
        // if (tempResult.length > 0) {result = 1}

    } catch (error) {
        result = 0
    }

    return result




}

async function deleteTable(tableName) {
    console.log(`..DELETING ${tableName} TABLE`)

    var sql = `DROP TABLE ${tableName}`;
    // const result = await doQuery(sql)
    // return result

    var result = 1
    try {
        await doQuery(sql)

    } catch (error) {
        result = 0
    }

    return result
}


async function doQuery(queryToDo) {
    let pro = new Promise((resolve,reject) => {
        const query = queryToDo;
        connection.query(query, function (err, result) {
            if (err)
            {
                throw err;
                // resolve (0)
            }
            else {
                resolve(result);
            }
        });
    })
    return pro.then((val) => {
        return val;
    })
}

async function recordsFromATableGrab(type, regNo, tableName, condition=false) {
    // console.log("@RECORDS FROM A TABLE GRAB", type)

    var sql = ""
    if (type === "UTME") {
        if (condition) {
            sql = `SELECT
  reg_num, fullname, sex, state, utme_aggregate, department, lga, subject_1, subject_1_score, subject_2,
  subject_2_score, subject_3, subject_3_score, english_score, phone, email, password, bio_data
  FROM ${tableName} WHERE reg_num = '${regNo}'
  `
        }
        else {
            sql = `SELECT
  reg_num, fullname, sex, state, utme_aggregate, department, lga, subject_1, subject_1_score, subject_2,
  subject_2_score, subject_3, subject_3_score, english_score
  FROM ${tableName} WHERE reg_num = '${regNo}'
  `
        }
    }

    else if (type === "SAVEUTMESTATUS") {
        sql = `SELECT
  reg_num, department, school, student_type, recommendation, qualified
  FROM ${tableName} WHERE reg_num = '${regNo}'
  `
    }
    else if (type === "DE") {
        sql = `SELECT reg_num, fullname, sex, state, department, lga, phone
  FROM ${tableName} WHERE reg_num = '${regNo}'`;

    }

    else if (type === "PRE") {
        sql = `SELECT
  reg_num, fullname, jamb_score,prescience_no, subjects,best_of_four,sex, state,department_admitted, average,
  phone,email,bio_data,added, edited

  FROM ${tableName} WHERE reg_num = '${regNo}'
  `
    }
    else if (type === "JUPEB") {
        sql = `SELECT
  reg_num,jupeb_no, fullname, subjects,total_score,first_choice,second_choice, remarks,bio_data,added, edited
   FROM ${tableName} WHERE reg_num = '${regNo}'
  `

    }
    else if (type === "SUP") {
        sql = `SELECT id,
  reg_num,preferred_course,source,added,edited
  FROM ${tableName} WHERE reg_num = '${regNo}'
  `

    }
    else if (type === "POSTUTME") {
        sql = `SELECT
  reg_num,utme_score,putme_score,calculated_average,added, edited
  FROM ${tableName} WHERE reg_num = '${regNo}'
  `

    }

    const result = await doQuery(sql)
    return result

}


async function grabDepartmentCutoff(type, department, tableName) {
    console.log("@RECORDS FROM A DEPARTMENT GRAB", type)

    var sql = ""
    if (type === "UTME") {
        sql = `SELECT
  id, department, utme_cutoff, putme_cutoff
  FROM ${tableName} WHERE department = '${department}'
  `
    }
    const result = await doQuery(sql)
    return result

}

async function grabDepartmentsCutoff(type, tableName) {
    // console.log("@RECORDS FROM ALL DEPARTMENTS GRAB", type)

    var sql = ""
    if (type === "UTME") {
        sql = `SELECT
  id, department, utme_cutoff, putme_cutoff
  FROM ${tableName}
  `
    }
    const result = await doQuery(sql)
    return result

}


async function getExcelData(type, arrayBuffer) {
    console.log("reading excel..")
    let pro = readExcelFile(type, arrayBuffer)
    return pro.then((val) => {
        return val;
    })
}
async function removeEmpty(unprocessedUploadList) {
    const result = []
    unprocessedUploadList.forEach(e => {
        if (e.RG_NUM !== undefined && e.RG_NUM !== '' && e.RG_NUM !== ' ' ) {
            result.push(e)
            // console.log('this is e::',e.RG_NUM )
        }
    })
    return result
}
async function readExcelFile(type,arrayBuffer) {
    let answer = false;
    var data = new Uint8Array(arrayBuffer);
    var arr = new Array();
    // var i = 0;
    // if (type == "PRE") {}
    for(let i = 0; i !== data.length; ++i) {
        arr[i] = String.fromCharCode(data[i]);

    }
    let bstr = arr.join("");
    let workbook = reader.read(bstr, {type:"binary"});
    let first_sheet_name = workbook.SheetNames[0];
    let worksheet = workbook.Sheets[first_sheet_name];
    let tempUpload = reader.utils.sheet_to_json(worksheet,{raw:true});




    tempUTME[type] = await removeEmpty(tempUpload);
    // const result = []
    // tempUpload.forEach(e => {
    //   // if (e.RG_NUM !== undefined && e.RG_NUM !== '' && e.RG_NUM !== ' ' ) {
    //     console.log('this is e::',e.RG_NUM )
    //     result.push(e)
    //   // }
    // })

    // tempUTME[type] = result

    // console.log(`look at excel:: ${tempUTME[type]}`)
    // console.log(`look at excel1:: ${tempUTME[type][0].RG_NUM}`)
    // console.log('tempUTMELENGTH::',tempUTME[type].length, tempUTME[type])
    // newAnswer = []
    // labels = {
    //   __EMPTY: 'S/NO',
    //   __EMPTY_1: 'NAME',
    //   __EMPTY_2: 'JAMB REG. NO.',
    //   __EMPTY_3: 'JAMB SCORE',
    //   __EMPTY_4: 'PRE-SCIENCE N0',
    //   __EMPTY_5: 'ENG',
    //   __EMPTY_6: 'MATHS',
    //   __EMPTY_7: 'BIO',
    //   __EMPTY_8: 'CHEM',
    //   __EMPTY_9: 'PHY',
    //   __EMPTY_10: 'GEO',
    //   __EMPTY_11: 'ECONS',
    //   __EMPTY_12: 'GOVT',
    //   __EMPTY_13: 'LIT',
    //   __EMPTY_14: 'BEST 4 TOTAL',
    //   __EMPTY_15: 'SEX ',
    //   __EMPTY_16: 'STATE OF ORIGIN',
    //   __EMPTY_17: 'AVG.S'
    // }
    // for (var i = 0; i < tempUTME[type].length; i++) {
    //   console.log("ITEM LEN",Object.keys(tempUTME[type][i]), Object.keys(tempUTME[type][i]).length)
    //   lengthObject = Object.keys(tempUTME[type][i]).length
    //   if (i > 2 && lengthObject > 1)
    //   {
    //     ObjecttempUTME[type][i]

    //   }

    // }
    if (tempUTME[type].length > 0) {answer =  true;}
    return answer;
}



function httpsPost({body, ...options}) {
    return new Promise((resolve,reject) => {
        const req = https.request({
            method: 'POST',
            ...options,
        }, res => {
            const chunks = [];
            res.on('data', data => chunks.push(data))
            res.on('end', () => {
                let resBody = Buffer.concat(chunks);
                switch(res.headers['content-type']) {
                    case 'application/json':
                        resBody = JSON.parse(resBody);
                        break;
                }
                resolve(resBody)
            })
        })
        req.on('error',reject);
        if(body) {
            req.write(body);
        }
        req.end();
    })
}






//app.use(bodyParser.json());
// app.use(express.json());
// app.use(morgan('tiny'));

// app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, content-type,accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');

    next();
});

async function addRecord2(type,tableName, toSendSample, phone='') {
    // console.log("to send sample::", toSendSample)
    // console.log("to send reg no::", toSendSample.reg_num)
    let School = "";
    try {
        if (!isNullOrUndefined(phone) && phone !== '' &&  phone !== ' ' && phone !== '0'){
            if (phone.toString() ==="1") {School = "UMUNZE" }
            if (phone.toString() ==="2") {School = "AUCHI" }
            if (phone.toString() ==="3") {School = "POPE JOHN" }
            if (phone.toString() ==="4") {School = "ESCET" }
        }
        else {School = 'UNIZIK'}
    }
    catch {School = 'UNIZIK'}
    console.log('SCHOOL TO BE SAVED::', School)
    let queryTemp = `INSERT INTO ${tableName} (
    reg_num, lastname, firstname, middlename, sex, state, utme_aggregate, department, faculty, lga, subject_1, subject_1_score, subject_2,
    subject_2_score, subject_3, subject_3_score, english_score, school, student_type, recommendation, qualified)

 VALUES ('${toSendSample.reg_num}', '${await checkForApostro(toSendSample.lastname)}',
 '${await checkForApostro(toSendSample.firstname)}','${await checkForApostro(toSendSample.middlename)}',
 '${toSendSample.sex}', '${await checkForApostro(toSendSample.state)}',
 ${toSendSample.utme_aggregate ? toSendSample.utme_aggregate : 0}, '${await checkForApostro(toSendSample.department)}', '${toSendSample.faculty}',
 '${await checkForApostro(toSendSample.lga)}', '${toSendSample.subject_1}', ${toSendSample.subject_1_score ? toSendSample.subject_1_score : 0},
 '${toSendSample.subject_2}', ${toSendSample.subject_2_score ? toSendSample.subject_2_score : 0}, '${toSendSample.subject_3}',
 ${toSendSample.subject_3_score ? toSendSample.subject_3_score : 0}, ${toSendSample.english_score ? toSendSample.english_score : 0}, '${School}', ${toSendSample.student_type}, '${toSendSample.recommendation}', ${toSendSample.qualified})`

// console.log(queryTemp)
// console.log("\n")
    await doQuery(queryTemp)
}

async function addRecord(type,tableName, i, schoolType='') {

    var queryTemp = ""



    if (type === 'UTME' && schoolType !== '') {
        // console.log("@ADD RECORD-type22", type22)

        queryTemp = `INSERT INTO ${tableName} (
      reg_num, fullname, sex, state, utme_aggregate, department, lga, subject_1, subject_1_score, subject_2,
      subject_2_score, subject_3, subject_3_score, english_score, phone)

    VALUES ('${tempUTME[type][i].RG_NUM}', '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}','${tempUTME[type][i].RG_SEX}', '${await checkForApostro(tempUTME[type][i].STATE_NAME)}',
    ${tempUTME[type][i].RG_AGGREGATE},
    '${await checkForApostro(tempUTME[type][i].CO_NAME)}', '${await checkForApostro(tempUTME[type][i].LGA_NAME)}', '${tempUTME[type][i].Subject1}', ${tempUTME[type][i].RG_Sub1Score},
    '${tempUTME[type][i].Subject2}', ${tempUTME[type][i].RG_Sub2Score}, '${tempUTME[type][i].Subject3}', ${tempUTME[type][i].RG_Sub3Score},
    ${tempUTME[type][i].EngScore}, '${schoolType}')`
    }
    else if (type === 'UTME') {
        queryTemp = `INSERT INTO ${tableName} (
      reg_num, fullname, sex, state, utme_aggregate, department, lga, subject_1, subject_1_score, subject_2,
      subject_2_score, subject_3, subject_3_score, english_score)

    VALUES ('${tempUTME[type][i].RG_NUM}', '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}','${tempUTME[type][i].RG_SEX}', '${await checkForApostro(tempUTME[type][i].STATE_NAME)}',
    ${tempUTME[type][i].RG_AGGREGATE},
    '${await checkForApostro(tempUTME[type][i].CO_NAME)}', '${await checkForApostro(tempUTME[type][i].LGA_NAME)}', '${tempUTME[type][i].Subject1}', ${tempUTME[type][i].RG_Sub1Score},
    '${tempUTME[type][i].Subject2}', ${tempUTME[type][i].RG_Sub2Score}, '${tempUTME[type][i].Subject3}', ${tempUTME[type][i].RG_Sub3Score},
    ${tempUTME[type][i].EngScore})`
    }

    else if (type === 'DE' && schoolType !== '') {
        queryTemp = `INSERT INTO ${tableName} (
       reg_num, fullname, sex, state, department, lga, phone)

    VALUES ('${tempUTME[type][i].RG_NUM}', '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}',
    '${tempUTME[type][i].RG_SEX}', '${await checkForApostro(tempUTME[type][i].STATENAME)}',
    '${await checkForApostro(tempUTME[type][i].CO_NAME)}', '${await checkForApostro(tempUTME[type][i].LGA)}',
    '${schoolType}')`
    }

    else if (type === 'DE') {
        queryTemp = `INSERT INTO ${tableName} (
       reg_num, fullname, sex, state, department, lga)

    VALUES ('${tempUTME[type][i].RG_NUM}', '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}',
    '${tempUTME[type][i].RG_SEX}', '${await checkForApostro(tempUTME[type][i].STATENAME)}',
    '${await checkForApostro(tempUTME[type][i].CO_NAME)}', '${await checkForApostro(tempUTME[type][i].LGA)}')`
    }

    else if (type === 'PRE') {
        queryTemp = `INSERT INTO ${tableName} (
      reg_num, fullname, jamb_score, prescience_no, subjects, best_of_four, sex, state, department_admitted, lga, average)

    VALUES ('${tempUTME[type][i].RG_NUM}', '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}',${tempUTME[type][i].RG_AGGREGATE},
    '${tempUTME[type][i].PRE_NUM}', ${tempUTME[type][i].SUBS}, '${tempUTME[type][i].BO4}', '${tempUTME[type][i].RG_SEX}', '${await checkForApostro(tempUTME[type][i].STATE_NAME)}',

    '${await checkForApostro(tempUTME[type][i].CO_NAME)}', '${await checkForApostro(tempUTME[type][i].LGA_NAME)}', ${tempUTME[type][i].AVG})`

    }

    else if (type === 'JUPEB') {
        queryTemp = `INSERT INTO ${tableName} (
      reg_num, jupeb_no,  fullname, subjects, total_score, first_choice, second_choice, remarks)

    VALUES ('${tempUTME[type][i].RG_NUM}', '${tempUTME[type][i].JUP_NUM}', '${await checkForApostro(tempUTME[type][i].RG_CANDNAME)}',
    ${tempUTME[type][i].SUBS}, ${tempUTME[type][i].TOT_SCO}, '${tempUTME[type][i].FIRST_CO}',
    '${tempUTME[type][i].SECOND_CO}', '${await checkForApostro(tempUTME[type][i].REMK)}') `



    }
    else if (type === 'SUP') {

        queryTemp = `INSERT INTO ${tableName} (
      reg_num, preferred_course,  source)

    VALUES ('${tempUTME[type][i].RG_NUM}', '${tempUTME[type][i].PREF_CO}',
    '${await checkForApostro(tempUTME[type][i].SOURCE)}') `



    }
    else if (type === 'POSTUTME') {
        queryTemp = `INSERT INTO ${tableName} (
      reg_num, utme_score,putme_score, calculated_average)

    VALUES ('${tempUTME[type][i].RG_NUM}', ${tempUTME[type][i].RG_AGGREGATE},
    ${tempUTME[type][i].PU_AGGREGATE}, ${tempUTME[type][i].CALC_AGGREGATE}) `

    }


    await doQuery(queryTemp)
}

// dealing with apostrophes content
async function checkForApostro(aString) {
    var answer = ''
    if (aString !== null && aString !== undefined)
    {
        var answerArray = aString.split(`'`)
        if (answerArray.length > 1){
            for (var i = 0; i < answerArray.length; i++) {
                if (i % 2 === 0) { answer = answer + answerArray[i] + `''`;}
                else { answer = answer + answerArray[i]}
            }
            // console.log("CHECK FOR APOST::", answer)
        }
        else {answer = aString}

    }

    return answer
}

async function addRecords(type,tableName, schoolType = '') {
    // console.log("@ADD RECORDS")
    var totalLength  = tempUTME[type].length
    for (let i = 0; i < totalLength; i++) {
        // for (let i = 0; i < 25; i++) {
        try {
            // console.log("ENTER  TRY AT @AddRecords")
            // fetch prescience metadata
            if (type === "PRE" && tableName === tempTableName[type] )
            {
                await fetchPrescienceMetaData(tempUTME[type][i])
            }
            await addRecord(type,tableName, i, schoolType)
            if (tableName === mainTableName[type]) {
                uploadStatusMessage[type] = `\n adding records to the main ${type} table (${i+1}  of ${totalLength})`

            }
            else {
                uploadStatusMessage[type] = `\n adding records to the temp ${type} table (${i+1}  of ${totalLength})`
            }

            if (tableName === tempTableName[type]) {tempDataReceived[type].push(tempUTME[type][i])}
            if (tableName === mainTableName[type]) {tempDataMovedToMain[type].push(tempUTME[type][i])}
            // console.log("DONE WITH TRY AT @AddRecords")
        } catch (error) {
            dataNotProcessed[type].push(tempUTME[type][i])
        }

    }
}

async function getTimeTaken(type, push = false) {
    let date_end = new Date();
    let time_taken = 0
    if (!push) {time_taken  = date_end - date_start[type]}
    else {time_taken  = date_end - pushDate_start[type]}
    // let time_taken  = date_end - date_start[type]
    let  totalSeconds = Math.floor(time_taken/1000)

    let hours = Math.floor(totalSeconds/3600);
    // current minutes
    let minutes = Math.floor((totalSeconds%3600)/60)

    // current seconds
    let seconds = Math.floor((totalSeconds%3600)%60)
    // let seconds = time_taken.getSeconds();
    let Atime_taken_string = (hours + "HH" + minutes + "MM" + seconds + 'SS')
    return Atime_taken_string
}

async function getStat(type) {
    if (uploadStatus[type] !== 'ready' && uploadStatus[type] !== 'success' ) {
        time_taken_string[type] = await getTimeTaken(type);
    }


    var statusMessage = {
        status: uploadStatus[type],
        status_message: uploadStatusMessage[type],
        time_taken: time_taken_string[type],
        total_rowdata_uploaded_to_api: tempUTME[type].length,

        rowdata_saved_to_temp: tempDataReceived[type].length,
        new_rowdata_in_main: tempDataMovedToMain[type].length,
        rowdata_info_updated: updatedData[type].length,
        rowdata_processed_success: totalTempDataProcessed[type].length,
        rowdata_error: dataNotProcessed[type].length,
        type:type
    }

    return statusMessage
}

async function getPushStat(type) {
    if (pushStatus[type] !== 'ready' && pushStatus[type] !== 'success' ) {
        pushTime_taken_string[type] =  await getTimeTaken(type, true);
        // console.log('time taken::',pushTime_taken_string[type] )
    }


    var statusMessage = {
        status: pushStatus[type],
        pushParams: pushParams[type],
        status_message: pushStatusMessage[type],
        time_taken: pushTime_taken_string[type],
        total_not_saved:pushDataNotSaved[type],
        total_rowdata_pushed_to_api: pushDataProcessed[type].length, //successful push regno
        total_successful_batch: successBatchCount[type],
        total_error: pushDataNotProcessed[type].length,
        total2push: pushDataTotal2Push[type].length, // count of regno to send to chuka
        type:type
    }

    return statusMessage
}
function resetPushVariables(type) {
    pushStatus[type] = 'pending'
    pushParams[type] = []
    pushStatusMessage[type] = []
    pushDataProcessed[type] = []
    pushDataNotProcessed[type] = []
    pushDataTotal2Push[type] = []
    pushTime_taken_string[type] = '-'
    pushDate_start[type] = new Date()
}

function resetVariables(type) {
    uploadStatus[type] = 'pending'
    tempDataReceived[type] = []
    tempDataMovedToMain[type] = []
    updatedData[type] = []
    totalTempDataProcessed[type] = []
    dataNotProcessed[type] = []
    time_taken_string[type] = ''
    date_start[type] = new Date()
}

app.get('/', (req, res, next) => {
    res.status(200).json({
        statusMessage: "Success, this works node"
    });

})
// batch, currentNo, totalToProcess
var batchCondition = [0,0,0]

// app.get('/api/push-qualified-status', (req, res, next) => {
//     // app.route('/api/status').get(onStatusQuery)
//     // async function onStatusQuery(req, res) {

//     try {
//         res.status(200).json({
//             batchCondition: {batch:batchCondition[0], currentNo:batchCondition[1], total:batchCondition[2]}
//         });
//     } catch (error) {
//         res.status(500).json({
//             message: "Failed to retrieve status",
//         });
//     }
// })


app.get('/api/status', async (req, res, next) => {
// app.route('/api/status').get(onStatusQuery)
// async function onStatusQuery(req, res) {
    console.log("request", req.query.type)
    const type = req.query.type
    // type22 = req.body.type
    const seeLastOp = req.query.lastOpStat

    var statusMessage = {status: uploadStatus[type]}
    // if (seeLastOp) {statusMessage = lastOpStat}
    if (uploadStatus[type] !== 'ready') {

        // time_taken_string[type] = "";
//     time_taken_string[type] = getTimeTaken();


//   var statusMessage = {
//     status: uploadStatus[type],
//     status_message: uploadStatusMessage[type],
//     time_taken: time_taken_string[type],
//     total_rowdata_uploaded_to_api: tempUTME[type].length,

//     rowdata_saved_to_temp: tempDataReceived[type].length,
//     new_rowdata_in_main: tempDataMovedToMain[type].length,
//   rowdata_info_updated: updatedData[type].length,
//   rowdata_processed_success: totalTempDataProcessed[type].length,
//   rowdata_error: dataNotProcessed[type].length}
// }
        statusMessage = await getStat(type)
    }

    try {
        res.status(200).json({
            statusMessage
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve status",
        });
    }
})

app.get('/api/push-status', async (req, res, next) => {
    // app.route('/api/status').get(onStatusQuery)
    // async function onStatusQuery(req, res) {
        console.log("request", req.query.type)
        const type = req.query.type
        // type22 = req.body.type
        // const seeLastOp = req.query.lastOpStat
    
        var statusMessage = {status: pushStatus[type]}
        // if (seeLastOp) {statusMessage = lastOpStat}
        if (pushStatus[type] !== 'ready') {
    
            // time_taken_string[type] = "";
    //     time_taken_string[type] = getTimeTaken();
    
    
    //   var statusMessage = {
    //     status: uploadStatus[type],
    //     status_message: uploadStatusMessage[type],
    //     time_taken: time_taken_string[type],
    //     total_rowdata_uploaded_to_api: tempUTME[type].length,
    
    //     rowdata_saved_to_temp: tempDataReceived[type].length,
    //     new_rowdata_in_main: tempDataMovedToMain[type].length,
    //   rowdata_info_updated: updatedData[type].length,
    //   rowdata_processed_success: totalTempDataProcessed[type].length,
    //   rowdata_error: dataNotProcessed[type].length}
    // }
            statusMessage = await getPushStat(type)
        }
    
        try {
            res.status(200).json({
                statusMessage
            });
        } catch (error) {
            res.status(500).json({
                message: "Failed to retrieve push status",
            });
        }
    })
    

// endpoint for xlsx upload-receive Uploaded UTME
app.route('/api/uploadutme').post(onFileupload)

async function onFileupload(req, res) {
    const type ='UTME'
    // type22 = req.body.type
    const schoolType = req.body.type
    
    console.log("in uploadutme umunze-1, auchi-2..", schoolType)
    if (uploadStatus[type] !== 'ready' && uploadStatus[type] !== 'success') {
        res.status(204).json({
            message: "An upload operation is still ongoing. Try again later",
        });
    }

    else {
        resetVariables(type)
        // for each record in the temp table
        // hash that record h1
        // get the corresponding record on the main table
        // hash the main table record, h2
        // if h1 === h2 skip else replace main table record with temp table record


        let readExcel = true;
        let uploadSuccess = true;
        try {
            await getExcelData(type, req.files.file.data)
            console.log("done reading excel..")
        } catch (error) {
            readExcel = false
            console.log("error reading excel..")
        }

        if (readExcel) {
            try {

                // makeConnection()
                uploadStatus[type] = 'busy'
                uploadStatusMessage[type] = 'busy'
                try {
                    await makeConnection()
                    uploadStatusMessage[type] = uploadStatusMessage[type] + '\connecting to the DB'
                    
                } catch (error) {
                    console.log('db connection error', error)
                }

                // check if temp table exists // delete if it exists
                if (await checkTableExists(tempTableName[type])) {
                    console.log("deleting existing temp UTME table..")
                    uploadStatusMessage[type] += '\n deleting existing temp UTME table'
                    await deleteTable(tempTableName[type])
                }
                // create temp table
                uploadStatusMessage[type] += '\n create temp UTME table'
                console.log("create temp UTME table..")

                await createTable(type,tempTableName[type])
                if (tempUTME && tempUTME[type]) {
                    console.log("adding records to the temp UTME table..")
                    uploadStatusMessage[type] += '\n adding records to the temp UTME table'
                    await addRecords(type,tempTableName[type], schoolType)
                }
                if (await checkTableExists(mainTableName[type])) {
                    console.log("adding records to the main UTME table..")
                    uploadStatusMessage[type] += '\n adding records to the main UTME table'
                    await matchUTMECandidateHash(type,mainTableName[type], tempTableName[type], schoolType)
                }
                else {
                    await createTable(mainTableName[type])
                    console.log("adding records to the main UTME table..")
                    uploadStatusMessage[type] += '\n adding records to the main UTME table'

                    await addRecords(type,mainTableName[type], schoolType)
                }

                // closeConnection()
                console.log("upload successful..")
                uploadStatusMessage[type] += '\n upload successful'
                time_taken_string[type] = await getTimeTaken(type);
                uploadStatus[type] = 'success'
                lastOpStat = await getStat(type)
                // try {
                //     await closeConnection()
                //     uploadStatusMessage[type] = uploadStatusMessage[type] + '\closing the DB'
                //
                // } catch (error) {
                //     console.log('db closing error', error)
                // }
            } catch (error) {
                uploadSuccess = false;
                console.log("error writing to the database ..")
            }

        }



        try {
            if (uploadSuccess) {
                res.status(201).json({
                    message: "utme candidate data processed successfully"
                });
                // uploadStatus[type] = 'ready'
            }
            else {
                res.status(500).json({
                        message: "Error during processing",
                    }

                );
                uploadStatus[type] = 'ready'
            }

        } catch (error) {
            res.status(500).json({
                    message: "Error during processing",
                }

            );
            uploadStatus[type] = 'ready'

        }
    }





}
async function onFileupload2(req, res) {
    let type ='UTME'
    resetVariables(type)
    // for each record in the temp table
    // hash that record h1
    // get the corresponding record on the main table
    // hash the main table record, h2
    // if h1 === h2 skip else replace main table record with temp table record


    await getExcelData(type, req.files.file.data)
    makeConnection()
    // check if temp table exists // delete if it exists
    if (await checkTableExists(tempTableName[type])) {
        await deleteTable(tempTableName[type])
    }
    // create temp table
    await createTable(type,tempTableName[type])
    if (tempUTME && tempUTME[type]) {
        await addRecords(type,tempTableName[type])
    }
    if (await checkTableExists(mainTableName[type])) {
        await matchUTMECandidateHash(type,mainTableName[type], tempTableName[type])
    }
    else {
        await createTable(mainTableName[type])
        await addRecords(type,mainTableName[type])
    }

    closeConnection()

    time_taken_string[type] = getTimeTaken(type);
    uploadStatus[type] = 'success'


    try {
        res.status(201).json({
            message: "utme candidate data processed successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error during processing",
        });
    }



}

app.route('/api/uploaddecandidate').post(onFileuploadDE)
async function onFileuploadDE(req, res) {
    let type ='DE'
    let schoolType = req.body.type
    console.log("IN DE")

    if (uploadStatus[type] !== 'ready' && uploadStatus[type] !== 'success') {
        res.status(204).json({
            message: "An upload operation is still ongoing. Try again later",
        });
    }

    else {
        resetVariables(type)




        
        // for each record in the temp table
        // hash that record h1
        // get the corresponding record on the main table
        // hash the main table record, h2
        // if h1 === h2 skip else replace main table record with temp table record


        await getExcelData(type, req.files.file.data)


        try {
            await makeConnection()
            uploadStatusMessage[type] = uploadStatusMessage[type] + '\connecting to the DB'
            
        } catch (error) {
            console.log('db connection error', error)
        }


        // check if temp table exists // delete if it exists
        if (await checkTableExists(tempTableName[type])) {await deleteTable(tempTableName[type])}
        // create temp table
        console.log("IN DE- after check if temp table exists")

        const crttblResult = await createTable(type,tempTableName[type])
        // console.log('create table result::', crttblResult)
        if (tempUTME && tempUTME[type]) {
            // console.log('records to add::',tempUTME[type] )
            await addRecords(type,tempTableName[type], schoolType)
        }
        if (await checkTableExists(mainTableName[type])) {
            await matchUTMECandidateHash(type,mainTableName[type], tempTableName[type], schoolType)
        }


        else {
            await createTable(type,mainTableName[type])
            await addRecords(type, mainTableName[type], schoolType)
        }
        console.log("IN DE- after check if main table exists")

        // try {
        //     await closeConnection()
        //     uploadStatusMessage[type] = uploadStatusMessage[type] + '\closing the DB'
        //
        // } catch (error) {
        //     console.log('db closing error', error)
        // }

        time_taken_string[type] = await getTimeTaken(type);
        uploadStatus[type] = 'success'
        lastOpStat = await getStat(type)


        try {
            res.status(201).json({
                message: "DE candidate data processed successfully"
            });
        } catch (error) {
            res.status(500).json({
                message: "Error during processing",
            });
        }
    }



}

async function fetchPrescienceMetaData(aPrescienceRecord) {

}
app.route('/api/uploadpresciencecandidate').post(onFileuploadPRE)
async function onFileuploadPRE(req, res) {
    let type ='PRE'
    resetVariables(type)
    // for each record in the temp table
    // hash that record h1
    // get the corresponding record on the main table
    // hash the main table record, h2
    // if h1 === h2 skip else replace main table record with temp table record


    await getExcelData(type, req.files.file.data)
    await makeConnection()
    // check if temp table exists // delete if it exists
    // if (await checkTableExists(tempTableName)) {await deleteTable(tempTableName)}
    // create temp table
    // await createTable(type,tempTableName[type])
    // if (tempUTME && tempUTME[type]) {
    //   await addRecords(type,tempTableName[type])
    // }
    // if (await checkTableExists(mainTableName[type])) {
    //   await matchUTMECandidateHash(type,mainTableName[type], tempTableName[type])
    // }
    // else {
    //   await createTable(type,mainTableName[type])
    //   await addRecords(type, mainTableName[type])
    // }

    closeConnection()

    time_taken_string[type] = getTimeTaken(type);
    uploadStatus[type] = 'success'


    try {
        res.status(201).json({
            message: "utme candidate data processed successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error during processing",
        });
    }



}

app.route('/api/uploadjupebcandidate').post(onFileuploadJUPEB)
async function onFileuploadJUPEB(req, res) {
    let type ='JUPEB'
    resetVariables(type)
    // for each record in the temp table
    // hash that record h1
    // get the corresponding record on the main table
    // hash the main table record, h2
    // if h1 === h2 skip else replace main table record with temp table record


    await getExcelData(type,req.files.file.data)
    makeConnection()
    // check if temp table exists // delete if it exists
    if (await checkTableExists(tempTableName)) {await deleteTable(tempTableName)}
    // create temp table
    await createTable(type,tempTableName[type])
    if (tempUTME && tempUTME[type]) {
        await addRecords(type,tempTableName[type])
    }
    if (await checkTableExists(mainTableName[type])) {
        await matchUTMECandidateHash(type,mainTableName[type], tempTableName[type])
    }
    else {
        await createTable(type,mainTableName[type])
        await addRecords(type, mainTableName[type])
    }

    closeConnection()

    time_taken_string[type] = getTimeTaken();
    uploadStatus[type] = 'success'

    try {
        res.status(201).json({
            message: "utme candidate data processed successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error during processing",
        });
    }



}

app.route('/api/uploadsupcandidate').post(onFileuploadSUP)
async function onFileuploadSUP(req, res) {
    let type ='SUP'
    resetVariables(type)
    // for each record in the temp table
    // hash that record h1
    // get the corresponding record on the main table
    // hash the main table record, h2
    // if h1 === h2 skip else replace main table record with temp table record


    await getExcelData(type,req.files.file.data)
    makeConnection()
    // check if temp table exists // delete if it exists
    if (await checkTableExists(tempTableName)) {await deleteTable(tempTableName)}
    // create temp table
    await createTable(type,tempTableName[type])
    if (tempUTME && tempUTME[type]) {
        await addRecords(type,tempTableName[type])
    }
    if (await checkTableExists(mainTableName[type])) {
        await matchUTMECandidateHash(type,mainTableName[type], tempTableName[type])
    }
    else {
        await createTable(type,mainTableName[type])
        await addRecords(type, mainTableName[type])
    }

    closeConnection()

    time_taken_string[type] = getTimeTaken();
    uploadStatus[type] = 'success'


    try {
        res.status(201).json({
            message: "utme candidate data processed successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error during processing",
        });
    }



}

app.route('/api/uploadpostutme').post(onFileuploadPOSTUTME)
async function onFileuploadPOSTUTME(req, res) {
    let type ='POSTUTME'
    resetVariables(type)
    // for each record in the temp table
    // hash that record h1
    // get the corresponding record on the main table
    // hash the main table record, h2
    // if h1 === h2 skip else replace main table record with temp table record


    await getExcelData(type,req.files.file.data)
    makeConnection()
    // check if temp table exists // delete if it exists
    if (await checkTableExists(tempTableName)) {await deleteTable(tempTableName)}
    // create temp table
    await createTable(type,tempTableName[type])
    if (tempUTME && tempUTME[type]) {
        await addRecords(type,tempTableName[type])
    }
    if (await checkTableExists(mainTableName[type])) {
        await matchUTMECandidateHash(type,mainTableName[type], tempTableName[type])
    }
    else {
        await createTable(type,mainTableName[type])
        await addRecords(type, mainTableName[type])
    }

    closeConnection()

    time_taken_string[type] = getTimeTaken(type);
    uploadStatus[type] = 'success'

    try {
        res.status(201).json({
            message: "utme candidate data processed successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error during processing",
        });
    }



}

// candidate registration api calls

app.route('/api/register-candidate').post(onCandidateRegistration)
async function onCandidateRegistration(req, res) {
    const type = 'UTME'
    const record = JSON.parse(req.body[0]);
    console.log('.phone', record.phone)
    console.log('[phone]', record["phone"])
    console.log('this is the content of the register candidate data::', req.body)


    try {
        await updateStudentRecord_Registrations(type,mainTableName[type],record)
        res.status(201).json({
            message: "utme candidate registered successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error during registration",
        });
    }
}

app.route('/api/check-valid-regno2').get(onStudenRecordGet2)
async function onStudenRecordGet2(req, res) {
    const type = 'UTME'
    const regNo = req.query.regNo
    console.log('...received request to grab student info')
    console.log('...received request type = ', req.query.type)
    // const tableName = ""
    // console.log('received regno to query:::', req.query.regNo)
    const r1 = await recordsFromATableGrab(type,regNo, mainTableName[type],true)
    // console.log('retrieved No:::', req.query.regNo)
    console.log('...retrieved student record')

    // console.log('retrieved record:::', r1)
    try {
        const toSend = r1.length < 1  ? undefined : r1
        // console.log('toSend', toSend)
        if (toSend) {
            res.status(200).json({
                studentRecord: toSend, status: 200
            });
        }
        else {
            res.status(202).json({
                studentRecord: toSend, status: 202
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve record",
        });
    }
}


async function onSuggestFromPython(aJSON) {

//   fetch('https://example.com?' + new URLSearchParams({
//     foo: 'value',
//     bar: 2,
// }))

// new URLSearchParams({
//       foo: 'value',
//       bar: 2,
//   })

    console.log('see the jsonstringify',aJSON )
    console.log('see the URLSearchParams',new URLSearchParams(aJSON) )


    const headers = {
        "content-Type": "application/json",
        accept: 'application/json'
    }

    let options = {
        method:'GET',
        headers:headers,
        // body: (aJSON),
    };



    const url = pythonUrl + `/api/suggest-departments?subs=${JSON.stringify(aJSON)}`;
    await fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("received from python");
        })
        .catch(err => {console.log("ERROR AT PYTHON GET")})


}


async function postChukaBatch(batchList, cPM)  {
    let successM = true;
    let answerMessage = {};
    const headers = {
        "content-Type": "application/json",
        accept: 'application/json'
    }

    let options = {
        method:'POST',
        headers:headers,
        body: JSON.stringify({apiKey: apiKey, appSecret : appSecret}),
    };

    const url = tokenUrl

    await fetch(url, options)
        .then(response => response.json())
        .then(data => {
            console.log("received from token", data);
            if (data.code === "s200"){
                tkMessage = data.message;
            }


        })
        .catch(err => {
            console.log("ERROR AT TOKEN GET")
            successM = false;
            // tkMessage = oldtkMessage
            return err

        })
    if (tkMessage !== "") {
        const url2 = pushQualifiedUrl
        console.log("qualifiedUrl", url2)
        const headers2 = {
            "content-Type": "application/json",
            "Authorization":`Bearer ${tkMessage}`
        }

        let options2 = {
            method:'POST',
            headers:headers2,
            body: JSON.stringify({projectManagers: batchList}),
        };

        // console.log(JSON.stringify({projectManagers: batchList}))

        await fetch(url2, options2)
            .then(response => response.json())
            .then(data => {
                console.log("received from qualified upload", data);
                answerMessage = {status: 200}



            })
            .catch(err => {
                console.log("ERROR AT qualified upload", err)
                // console.log("ERROR payload", batchList)
                successM = false;
                cPM.push(batchList);
                return err

            })

    }

    return answerMessage

}

// async function waitForServerProcess(adelays) {
//     console.log("delay start", new Date())
//     await wait(1000 * adelays);
//     console.log("delay end", new Date())
// }

app.route('/api/push-to-chuka-save').get(onStudentsRecordSendSave)
async function onStudentsRecordSendSave(req, res) {
    let type = req.query.type
    if (pushStatus[type] !== 'ready' && pushStatus[type] !== 'success') {
        res.status(204).json({
            message: "A push operation is still ongoing. Try again later",
        });
    }

    else {
        resetPushVariables(type)


        pushStatus[type] = 'busy'
        // uploadStatus[type] = 'busy'
        pushStatusMessage[type] = pushStatusMessage[type] + '\nbusy'


        // type = "UTME"
        let batchNo = 100;
        let currentBatch = 0;
        let itemNo = 0;
        var projectManagers = []
        var issuesBatches = []
        const start = req.query.start
        const stop = req.query.stop
        const dateLast = req.query.datelast
        const bSize = req.query.batchsize
        const delayspec = req.query.delays
        const course = req.query.course
        // let totalData = []
        if (bSize) {
            batchNo = bSize
        }
        if (delayspec) {delays = delayspec}






        try {
            await makeConnection()
            pushStatusMessage[type] = pushStatusMessage[type] + '\connecting to the DB'
            
        } catch (error) {
            console.log('db connection error', error)
        }
        
        console.log("AWAIT REGNOS RESULT")

        const regNoList = await getAllRegNoMain(start, stop, dateLast, course, type)
        var total = 0
        try {
            total = regNoList.length;
            let totalData = []
            regNoList.forEach(e => {
                totalData.push(e['reg_num'])

            })
            pushDataTotal2Push[type] = totalData
            pushStatusMessage[type] = pushStatusMessage[type] + `\nfound ${total} records`

            // status: pushStatus[type],
            pushParams[type] = {'start' : start, 'stop': stop, 'dateLast': dateLast, 'batchsize': bSize, 'course': course}
            // console.log("REGNOS RESULT",regNoList)

        } catch  {
            console.log('No students found within this search parameters')
        }
        //  var total = regNoList.length;
        console.log("REGNOS RESULT",total)

        if (!await checkTableExists(`uaras_saved_utme_candidate_status`)) {
            // await matchUTMECandidateHashSaved(type,`uaras_saved_utme_candidate_status`,toSendSample)
            await createTable(type,`uaras_saved_utme_candidate_status`)

        }
        pushStatusMessage[type] = pushStatusMessage[type] + '\nstarting retrieve, save and push to Chuka'
        for (let i = 0; i < total ; i++) {

            const aRegNo = regNoList[i]['reg_num']
            batchCondition[1] = i
            const response = await requestWithRetry (i,aRegNo,type, projectManagers)
            // console.log("this is projectManagers", projectManagers)
            // console.log('phone::', regNoList[i]['phone'])
            try {
                await saveDetailsOfPush('SAVEUTMESTATUS', projectManagers[itemNo], regNoList[i]['phone'])
            }
            catch (e) {
                pushDataNotSaved[type].push(aRegNo);
            }


            if (i % batchNo === 0 && i !== 0) {
                currentBatch += 1
                batchCondition[0] = currentBatch

                const copyprojectManagers = projectManagers
                projectManagers = []
                itemNo = 0
                // await waitForServerProcess(delays)
                // const answerToken = {}
                const answerToken = await postChukaBatch(copyprojectManagers, issuesBatches)
                // if successful
                if (answerToken.status) 
                {
                    successBatchCount[type] = successBatchCount[type] + 1
                    let tempPushed = []
                    tempPushed = pushDataProcessed[type].concat(copyprojectManagers);
                    pushDataProcessed[type] = tempPushed
                    pushStatusMessage[type] = pushStatusMessage[type] + `\nbatch ${currentBatch} send to Chuka successful!`
                }
                else 
                {
                    let tempPushedNot = []
                    tempPushedNot = pushDataNotProcessed[type].concat(copyprojectManagers)
                    pushDataNotProcessed[type] = tempPushedNot
                    pushStatusMessage[type] = pushStatusMessage[type] + `\nbatch ${currentBatch} send to Chuka not successful!`
                }
                  

                // if (currentBatch === 1){
                    console.log('batch sample::',copyprojectManagers[0]);

                // }
                // issuesBatches = []

            }
            else if(i+ 1 === total){
                currentBatch += 1
                batchCondition[0] = currentBatch
                // await waitForServerProcess(delays)
                const copyprojectManagers = projectManagers
                // const answerToken = {}
                const answerToken = await postChukaBatch(copyprojectManagers, issuesBatches)// const waitanswer = await waitForServerProcess(delays)
                console.log('total number sent in this batch::', copyprojectManagers.length)
                if (answerToken.status) 
                {
                    successBatchCount[type] = successBatchCount[type] + 1
                    let tempPushed = []
                    tempPushed = pushDataProcessed[type].concat(copyprojectManagers);
                    pushDataProcessed[type] = tempPushed
                    // pushStatusMessage[type] = pushStatusMessage[type] + `\nbatch ${currentBatch} send to Chuka successful!`
                }
                else 
                {
                    let tempPushedNot = []
                    tempPushedNot = pushDataNotProcessed[type].concat(copyprojectManagers)
                    pushDataNotProcessed[type] = tempPushedNot
                    // pushStatusMessage[type] = pushStatusMessage[type] + `\nbatch ${currentBatch} send to Chuka not successful!`
                }
            }
            else{itemNo = itemNo + 1}
            console.log("COUNT OF PM::", itemNo)
            // projectManagers = []
            // console.log("this is i", i)

        }

        // try {
        //     await closeConnection()
        //     pushStatusMessage[type] = pushStatusMessage[type] + `\nClosing the DB`
        // } catch (error) {
        //     console.log('db close error', error)
        // }
        

        console.log("ISSUES----------")
        console.log(issuesBatches)
        console.log("ISSUES----------")

        pushTime_taken_string[type] = await getTimeTaken(type,true);
        pushStatus[type] = 'success'

        try {
            res.status(200).json({
                message: `post qualified successful `,
                count:total,
                status: 200
            });

        }
        catch (error) {
            res.status(500).json({
                message: "Error, Failed to send from batch of the record",
            });
        }


    }
}

//get maximum on main table
// for loop that takes from one to the end and sends them in batches of 500

app.route('/api/push-to-chuka').get(onStudentsRecordSend)
async function onStudentsRecordSend(req, res) {
    let type = "UTME"
    let batchNo = 100;
    currentBatch = 0;
    var projectManagers = []
    var issuesBatches = []
    const start = req.query.start
    const stop = req.query.stop
    const dateLast = req.query.datelast
    const bSize = req.query.batchsize
    const delayspec = req.query.delays
    const course = req.query.course
    if (bSize) {
        batchNo = bSize
    }
    if (delayspec) {delays = delayspec}


    console.log("AWAIT REGNOS RESULT")

    const regNoList = await getAllRegNoMain(start, stop, dateLast, course)
    var total = 0
    try {
        total = regNoList.length;
        // console.log("REGNOS RESULT",regNoList)

    } catch  {
        console.log('No students found within this search parameters')
    }
    //  var total = regNoList.length;
    console.log("REGNOS RESULT",total)

    batchCondition[2] = total

    let oldtkMessage = ""

    for (let i = 0; i < total ; i++) {

        const aRegNo = regNoList[i]['reg_num']
        batchCondition[1] = i
        const response = await requestWithRetry (i,aRegNo,type, projectManagers)
        if (i % batchNo === 0 && i !== 0) {
            currentBatch += 1
            batchCondition[0] = currentBatch

            const copyprojectManagers = projectManagers
            projectManagers = []
            // await waitForServerProcess(delays)

            const answerToken = await postChukaBatch(copyprojectManagers, issuesBatches)
            // issuesBatches = []

        }
        else if(i+ 1 === total){
            currentBatch += 1
            batchCondition[0] = currentBatch
            // await waitForServerProcess(delays)
            const copyprojectManagers = projectManagers
            const answerToken = await postChukaBatch(copyprojectManagers, issuesBatches)
            // const waitanswer = await waitForServerProcess(delays)
        }
        console.log("COUNT OF PM::", projectManagers.length)
    }

    console.log("ISSUES----------")
    console.log(issuesBatches)
    console.log("ISSUES----------")

    try {
        res.status(200).json({
            message: `post qualified successful `,
            count:total,
            status: 200
        });

    }
    catch (error) {
        res.status(500).json({
            message: "Error, Failed to send from batch of the record",
        });
    }


}

app.route('/api/push-to-chuka-de').get(onStudentsRecordSendDE)
async function onStudentsRecordSendDE(req, res) {
    let type = "DE"
    let batchNo = 100;
    currentBatch = 0;
    var projectManagers = []
    var issuesBatches = []
    const start = req.query.start
    const stop = req.query.stop
    const dateLast = req.query.datelast
    const bSize = req.query.batchsize
    const delayspec = req.query.delays
    const course = req.query.course
    if (bSize) {
        batchNo = bSize
    }
    if (delayspec) {delays = delayspec}


    console.log("AWAIT REGNOS RESULT")

    const regNoList = await getAllRegNoMain(start, stop, dateLast, course, type)
    var total = 0
    try {
        total = regNoList.length;
    } catch  {
        console.log('No students found within this search parameters')
    }
    console.log("REGNOS RESULT",total)

    batchCondition[2] = total

    let oldtkMessage = ""
    for (let i = 0; i < total ; i++) {

        const aRegNo = regNoList[i]['reg_num']
        batchCondition[1] = i
        const response = await requestWithRetry (i,aRegNo,type, projectManagers)
        if (i % batchNo === 0 && i !== 0) {
            currentBatch += 1
            batchCondition[0] = currentBatch

            const copyprojectManagers = projectManagers
            console.log('examples::',copyprojectManagers[1])
            projectManagers = []
            // await waitForServerProcess(delays)

            const answerToken = await postChukaBatch(copyprojectManagers, issuesBatches)
            // issuesBatches = []

        }
        else if(i+ 1 === total){
            currentBatch += 1
            batchCondition[0] = currentBatch
            // await waitForServerProcess(delays)
            const copyprojectManagers = projectManagers
            console.log('examples::',copyprojectManagers[1])
            const answerToken = await postChukaBatch(copyprojectManagers, issuesBatches)
            // const waitanswer = await waitForServerProcess(delays)
        }
        console.log("COUNT OF PM::", projectManagers.length)
    }

    console.log("ISSUES----------")
    console.log(issuesBatches)
    console.log("ISSUES----------")

    try {
        res.status(200).json({
            message: `post qualified successful `,
            count:total,
            status: 200
        });

    }
    catch (error) {
        res.status(500).json({
            message: "Error, Failed to send from batch of the record",
        });
    }

}




app.route('/api/sync-issues-check').get(onStudentSyncCheck)
async function onStudentSyncCheck(req, res) {
    const batchNo = req.query.batchsize
    var batchStart = -1
    // var batchNo = 5000
    var projectManagers = []
    var type = "UTME"


    var rawList = await readJSONChuka(batchStart)
    batchStart += 21 //1
    var regNoList = []
    console.log("LENGTH::", rawList.length)
    var end = rawList.length
    for (let i=0;i<end;i++){
        regNoList.push(rawList[i].j_reg)
    }



    var toSend2Chuka = []
    var total = regNoList.length;
    // for (let i=0;i<10;i++){console.log(regNoList[i])}
    //run check for qualified
    for (let i = 19001; i < total ; i++) {
        const aRegNo = regNoList[i]
        const response = await requestWithRetry_sync_issues (i,aRegNo,type, projectManagers)

        if ((i % batchNo === 0 && i !== 0) || (i+ 1 === total)) {
            var result_total = projectManagers.length

            // prepare the json object
            for (let i = 0; i < result_total ; i++) {
                var found = false;
                for (let j = 0; j < total && !found ; j++) {
                    if (projectManagers[i].reg_num === rawList[j].j_reg ) {
                        var temp = rawList[j]
                        temp.qualified = "1";
                        temp.recommendation = {};
                        toSend2Chuka.push(temp)
                        found = true;
                    }
                }
            }

            // save to JSON object file
            await writeJSONChuka(toSend2Chuka, batchStart)
            batchStart += 1
            //reset batch array
            toSend2Chuka = []
            projectManagers = []

        }

        // else if(i+ 1 === total){}



    }

    // console.log(projectManagers)


    // console.log("TO SEND TO CHUKA", toSend2Chuka)



    try {
        res.status(200).json({
            message: 'success'
        });

    }
    catch (error) {
        res.status(500).json({
            message: "Error, Failed to execute",
        });
    }
}

app.route('/api/sync-issues-check2').get(onStudentSyncCheck2)
async function onStudentSyncCheck2(req, res) {
    const batchNo = req.query.batchsize
    var batchStart = -1
    // var batchNo = 5000
    var projectManagers = []
    var type = "UTME"

//////////

    var newJ = await readJSONConfirm('jmb_new.json')

    var oldJ = await readJSONConfirm('jmb_old.json')

    var diff = []
    var end_newJ = newJ.length
    var end_oldJ = oldJ.length
    var newJList = []
    var oldJList = []
    console.log("LENGTH", end_oldJ,end_newJ )
    for (let i=0;i<end_newJ;i++){
        newJList.push(newJ[i].j_reg)
    }
    for (let i=0;i<end_oldJ;i++){
        oldJList.push(oldJ[i].j_reg)
    }
    for (let i = 0; i < end_oldJ;  i++) {
        var found22 = false
        for (let j = 0; j < end_newJ && (found22 != true); j++) {
            // if (!(oldJList[i] in newJList) && oldJ[i].total > 159) {
            //   diff.push(oldJ[i])
            // }
            if (oldJList[i] === newJList[j]) {found22 = true}

        }
        if(!found22 && parseInt(oldJ[i].total) > 159) {diff.push(oldJ[i])}


    }

    //xxx
    // prepare the json object
    // for (let i = 0; i < end_oldJ ; i++) {
    //   var found = false;
    //   for (let j = 0; j < end_newJ && !found ; j++) {
    //     if (oldJ[i].j_reg === newJ[j].j_reg ) {

    //       found = true;
    //       // console.log('true')
    //     }
    //   }
    //   if (found === true) {diff.push(oldJ[i]) }
    // }
    //xxx

    await writeJSONConfirm(diff,'diff.json')
    console.log("DONE")



    ///////




    try {
        res.status(200).json({
            message: 'success'
        });

    }
    catch (error) {
        res.status(500).json({
            message: "Error, Failed to execute",
        });
    }
}

app.route('/api/add_both_jsons').get(addBothJSON)
async function addBothJSON(req, res) {
    // read bulk JSON
    // read seived JSON
    // for each reg NO in seived JSON array
    // for each regNo in bulk JSON, if regNO_sived = regNO_bulk then update the qualified and recommendation
    // save JSON

    var newJ = await readJSONConfirm('newBulk.json')

    var oldJ = await readJSONConfirm('jmb_old.json')

    var end_newJ = newJ.length
    var end_oldJ = oldJ.length
    var newJList = []
    var oldJList = []
    console.log("LENGTH", end_oldJ,end_newJ )
    // for (let i=0;i<end_newJ;i++){
    //     newJList.push(newJ[i].j_reg)
    //   }
    // for (let i=0;i<end_oldJ;i++){
    //     oldJList.push(oldJ[i].j_reg)
    //   }
    // var newBulk = []
    // for (let i = 0; i < end_oldJ;  i++) {
    //   var found22 = false
    //   var tempItem = {}
    //   for (let j = 0; j < end_newJ && (found22 != true); j++) {
    //     if (oldJList[i] === newJList[j]) {
    //       found22 = true;
    //       tempItem = newJ[j]

    //     }
    //   }
    //   if(!found22) { tempItem = oldJ[i]}
    //   newBulk.push(tempItem)


    // }

    // await writeJSONConfirm(newBulk,'newBulk.json')

    console.log("DONE")

    try {
        res.status(200).json({
            message: 'success'
        });

    }
    catch (error) {
        res.status(500).json({
            message: "Error, Failed to execute",
        });
    }



}

async function requestWithRetry_sync_issues (ii, regNo, type, projectM) {
    console.log("INSIDE REQUEST WITH RETRY", ii)
    const MAX_RETRIES = 10;
    for (let i = 0; i <= MAX_RETRIES; i++) {
        try {

            return await getStudentRegistrationInfo_sync_issues(ii,regNo, type, projectM)
        } catch (err) {
            const timeout = Math.pow(2, i);
            console.log('Waiting', timeout, 'ms');
            await wait(timeout);
            console.log('Retrying', err.message, i);
        }
    }
}

async function getStudentRegistrationInfo_sync_issues(ii,regNo, type, projectM) {
    // else {
    let toSend2 = {}
    let type2 = 0
    r1 = await recordsFromATableGrab(type,regNo, mainTableName[type],true)
    // console.log('...retrieved student record', r1)
    try {
        const toSend = r1.length < 1  ? undefined : r1
        type2 = toSend[0]['phone'] ? toSend[0]['phone'] : 0
        const ajson =
            {
                score: toSend[0]['utme_aggregate'],
                department:encodeURIComponent(toSend[0]['department']),
                sub1: toSend[0]['subject_1'], sub2: toSend[0]['subject_2'], sub3: toSend[0]['subject_3']
            };

        var affiliateUpper = ['Federal college of education (technical) Umunze (FCETU)',
            'Enugu State College of Education (technical) (ESCET)',
            'Pope John Paul Seminary, Okpuno',
            'Auchi Polytechnic, Auchi, Delta State'
        ]
        var affiliateLower = ['Paul University, Awka',
            'Peter University, Achina-Onneh',
            'Legacy University, Okija']
        var recommend = {}
        var qualified = 1
        const url = pythonUrl + `/api/suggest-departments/${encodeURIComponent(JSON.stringify(ajson))}`;

        // handles affiliate recommendations
        if (type2) {
            if (ajson.score < 160) {qualified = 0}

            toSend2 = {
                reg_num: toSend[0]['reg_num'],
                lastname: toSend[0]['fullname'].split(' ')[0],
                firstname: toSend[0]['fullname'].split(' ')[1],
                middlename: toSend[0]['fullname'].split(' ')[2] ? toSend[0]['fullname'].split(' ')[2] : '',
                sex: toSend[0]['sex'],
                state: toSend[0]['state'],
                utme_aggregate: toSend[0]['utme_aggregate'],
                department: toSend[0]['department'],
                faculty: "",
                lga: toSend[0]['lga'],
                subject_1: toSend[0]['subject_1'],
                subject_1_score: toSend[0]['subject_1_score'],
                subject_2: toSend[0]['subject_2'],
                subject_2_score: toSend[0]['subject_2_score'],
                subject_3: toSend[0]['subject_3'],
                subject_3_score: toSend[0]['subject_3_score'],
                english_score: toSend[0]['english_score'],
                student_type:(type === "UTME" ? 1 : 2),
                recommendation: JSON.stringify(recommend),
                qualified: qualified


            }
            projectM.push(toSend2)

            return toSend2
        }
        else
        {
            await fetch(url)
                .then(response => response.json())
                .then(data => {
                    console.log("received from python");

                    if (data.combostatus !== 200) {qualified = 0}
                    if (!qualified) {
                        if (toSend[0]['utme_aggregate'] >= 160) {
                            if (data.suggest.length > 0) {
                                recommend = {suggestedUnizikCourses: data.suggest}
                            }
                            else {
                                recommend = {suggestAffiliate: affiliateUpper}
                            }

                        }
                        else if (toSend[0]['utme_aggregate'] >= 140) {recommend = {suggestAffiliate: affiliateLower}}
                    }

                    toSend2 = {
                        reg_num: toSend[0]['reg_num'],
                        lastname: toSend[0]['fullname'].split(' ')[0],
                        firstname: toSend[0]['fullname'].split(' ')[1],
                        middlename: toSend[0]['fullname'].split(' ')[2] ? toSend[0]['fullname'].split(' ')[2] : '',
                        sex: toSend[0]['sex'],
                        state: toSend[0]['state'],
                        utme_aggregate: toSend[0]['utme_aggregate'],
                        department: toSend[0]['department'],
                        faculty: "",
                        lga: toSend[0]['lga'],
                        subject_1: toSend[0]['subject_1'],
                        subject_1_score: toSend[0]['subject_1_score'],
                        subject_2: toSend[0]['subject_2'],
                        subject_2_score: toSend[0]['subject_2_score'],
                        subject_3: toSend[0]['subject_3'],
                        subject_3_score: toSend[0]['subject_3_score'],
                        english_score: toSend[0]['english_score'],
                        student_type:(type === "UTME" ? 1 : 2),
                        recommendation: JSON.stringify(recommend),
                        qualified: qualified


                    }

                    // console.log("TO SEND2", toSend2)

                    if (toSend2 && toSend2.qualified) {
                        // p2[ii+1] = toSend2
                        projectM.push(toSend2)
                        return toSend2
                        // return toSend2
                    }
                    else {
                        console.log("..error pushing to projectmanagers")
                        return error
                    }

                    // return toSend2


                })
                .catch(err => {
                    console.log("ERROR AT PYTHON GET")
                    return err

                })

        } }
    catch (error) {

        console.log("Error, Failed to retrieve record")
        return error
    }
    // return toSend2

}

async function readJSONChuka(batch = 0) {
    // var regNoList = []
    // try {
    //   fs.readFile('jmb.json', (err, jmb) => {
    //     if (err) throw err;
    //     let data = JSON.parse(jmb);
    //     console.log('async done');
    //     var end = data.length
    //   for (let i=0;i<end;i++){
    //     regNoList.push(data[i].j_reg)
    //   }
    //   return regNoList
    // });

    // console.log('This is after the read call');

    // }
    try {
        var data = []
        if (batch === -1) {data = JSON.parse(fs.readFileSync('jmb.json'));}
        else {
            var filename  = `jmb${batch}.json`;
            data = JSON.parse(fs.readFileSync(filename));
        }

        return data
    }
    catch(e) {
        'Issues with read JSON Chuka'
        return []
    }

}
async function writeJSONChuka(jsonList, batch) {
    let data = []
    if (batch !== 0) {
        var old = await readJSONChuka(batch - 1);
        for (let i = 0; i < jsonList.length; i++) {old.push(jsonList[i]);}
        data = JSON.stringify(old);
    }
    else{data = JSON.stringify(jsonList);}
    fs.writeFileSync(`jmb${batch}.json`, data);
}


async function readJSONConfirm(filename) {

    try {
        var data = []
        data = JSON.parse(fs.readFileSync(filename));


        return data
    }
    catch(e) {
        'Issues with read JSON Chuka'
        return []
    }

}
async function writeJSONConfirm(jsonList, filename) {
    let data = []

    data = JSON.stringify(jsonList);
    fs.writeFileSync(filename, data);
}

async function onStudentsRecordBatch(req, res) {
    let type = "UTME"
    let batchNo = 100;
    currentBatch = 0;
    var projectManagers = []
    const start = req.query.start
    const stop = req.query.stop
    const bSize = req.query.batchsize
    const delayspec = req.query.delays
    if (bSize) {
        batchNo = bSize
    }
    if (delayspec) {delays = delayspec}


    console.log("AWAIT REGNOS RESULT",)

    const regNoList = await getAllRegNoMain(start, stop)

    var total = regNoList.length;
    batchCondition[2] = total

    // console.log("view List regNO",regNoList)
    // const p2 = []
    // for (let i = 0; i < total ; i++) {p2.push({})}
    let oldtkMessage = ""

    for (let i = 0; i < total ; i++) {

        // console.log("regNO",regNoList[i])

        // console.log("regNO[]",regNoList[i]['reg_num'])
        const aRegNo = regNoList[i]['reg_num']
        batchCondition[1] = i

        // const aRegNo = JSON.stringify({regNo:regNoList[i]['reg_num']})
        // await onStudenRecordGet(query=aRegNo).then(response => {
        //   console.log("response::", response)
        //   projectManagers.push(response.studentRecord)})
        // const response = await getStudentRegistrationInfo(aRegNo, type, projectManagers)
        const response = await requestWithRetry (i,aRegNo,type, projectManagers)
        // console.log("WHAT IS I", i)

        // if (i % batchNo == 0 && i != 0) {
        // console.log("MODE POINT::", i,projectManagers.length)
        // console.log("----Content----")
        // console.log(projectManagers)
        currentBatch += 1
        batchCondition[0] = currentBatch

        // const copyprojectManagers = projectManagers
        // projectManagers = []
        // await waitForServerProcess(delays)
        // const answerToken = await postChukaBatch(copyprojectManagers)
        // answerToken.then((response) =>{})postChukaBatch
        //   const waitanswer = await waitForServerProcess(delays)
        // }
        // else if(i+ 1 === total){
        //   currentBatch += 1
        //   batchCondition[0] = currentBatch
        //   // await waitForServerProcess(delays)
        //   const answerToken = await postChukaBatch(projectManagers)
        //   const waitanswer = await waitForServerProcess(delays)


    }
    console.log("COUNT OF PM::", projectManagers.length)
    // const response = await requestWithRetry (i,regNoList[i]['reg_num'],type, projectManagers,p2)
    // .then (response=>
    //   {

    //     console.log("responserequestwithrety=", response)

    //   }
    //   )
    // await getStudentRegistrationInfo(regNoList[i]['reg_num'],type)
    // .then(response => response.json())

    // .then(infoR => {
    //   try {
    //     console.log("info", infoR)
    //      if (getCountOfKeys(infoR) > 0){ projectManagers.push(infoR) }
    //   } catch (error) {
    //     console.log("error reading info")
    //   }

    //   if (i % batchNo === 0) {
    //     sendBatch(projectManagers)
    //     projectManagers = []
    //     // regNoList = []
    //   }

    // })
    // console.log("info(outside", info)
    // if ((i % batchNo) === 0) {

    // await sendBatch(i, batchNo, projectManagers, response)
    // projectManagers = []
    // regNoList = []
    // }




    try {
        res.status(200).json({
            projectManagers: projectManagers
        });

    }
    catch (error) {
        res.status(500).json({
            message: "Error, Failed to send from batch of the record",
        });
    }


}

async function getAllRegNoMain(start, stop,
                               dateLast, course, type="UTME") {
    // var type = "UTME"
    let queryTemp = '';
    if (start || stop || dateLast || course) {
        queryTemp = `SELECT reg_num, phone FROM ${mainTableName[type]}
  WHERE id >= ${start ? start : 0} `
        if (stop) {
            queryTemp +=  ` AND id <= ${stop}`;
        }
        if (dateLast) {
            queryTemp +=  ` AND edited >= '${dateLast}'`
        }

        if (course) {
            queryTemp +=  ` AND department LIKE '${course}%'`
        }

        console.log('getallregNo query::', queryTemp)

    }
    else{
        queryTemp = `SELECT reg_num FROM ${mainTableName[type]}
  `
    }
    const answer = await doQuery(queryTemp)
    console.log('.....retrieved all regNos:::')
    try {
        const toSend = answer.length < 1  ? undefined : answer
        console.log('..gottent RegNos')
        return toSend


    } catch (error) {
        console.log('ERROR AT GET ALL REGNOS')
        return error
    }
}



function wait (timeout) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, timeout);
    });
}

async function requestWithRetry (ii, regNo, type, projectM) {
    console.log("INSIDE REQUEST WITH RETRY", ii)
    const MAX_RETRIES = 10;
    for (let i = 0; i <= MAX_RETRIES; i++) {
        try {

            return await getStudentRegistrationInfo(ii,regNo, type, projectM)
        } catch (err) {
            const timeout = Math.pow(2, i);
            console.log('Waiting', timeout, 'ms');
            await wait(timeout);
            console.log('Retrying', err.message, i);
        }
    }
}

async function postChukaBatch_with_retry (projectMList) {
    console.log("INSIDE REQUEST WITH RETRY postChukaBatch")
    const MAX_RETRIES = 10;
    for (let i = 0; i <= MAX_RETRIES; i++) {
        try {

            return await postChukaBatch(projectMList)
        } catch (err) {
            const timeout = Math.pow(2, i);
            console.log('Waiting', timeout, 'ms');
            await wait(timeout);
            console.log('Retrying', err.message, i);
        }
    }
}

async function saveDetailsOfPush(type,toSendSample, phone) {
    // makeConnection()

    // if (await checkTableExists(`uaras_saved_utme_candidate_status`)) {
    await matchUTMECandidateHashSaved(type,`uaras_saved_utme_candidate_status`,toSendSample, phone)

    // }
    // else {
    //   await createTable(type,`uaras_saved_utme_candidate_status`)
    //   await addRecord2(`uaras_saved_utme_candidate_status`,toSendSample)
    // }

    // closeConnection()
}

function isNullOrUndefined (value) {
    return (value === null || value === undefined)

    // `value == null` is the same as `value === undefined || value === null`
}

async function getStudentRegistrationInfo(ii,regNo, type, projectM) {
    // else {
    let toSend2 = {}
    let type2 = 0;


    // catch {School = 'UNIZIK'}
    const r1 = await recordsFromATableGrab(type,regNo, mainTableName[type],true)
    // console.log('...retrieved student record', r1)
    const toSend = r1.length < 1  ? undefined : r1
    if (type === "DE") {
        toSend2 = {
            reg_num: toSend[0]['reg_num'],
            lastname: toSend[0]['fullname'].split(' ')[0],
            firstname: toSend[0]['fullname'].split(' ')[1],
            middlename: toSend[0]['fullname'].split(' ')[2] ? toSend[0]['fullname'].split(' ')[2] : '',
            sex: toSend[0]['sex'],
            state: toSend[0]['state'],
            utme_aggregate: '',
            department: toSend[0]['department'],
            faculty: "",
            lga: toSend[0]['lga'],
            subject_1: '',
            subject_1_score: '',
            subject_2: '',
            subject_2_score: '',
            subject_3: '',
            subject_3_score: '',
            english_score: '',
            student_type:2,
            recommendation: JSON.stringify({}),
            qualified: 1


        }
        projectM.push(toSend2)

        return toSend2
    }
    else if (type === "UTME") {

        try {
            const aphone = toSend[0]['phone']
            if (!isNullOrUndefined(aphone) && aphone !== '' &&  aphone !== ' ' && aphone !== 0 && aphone !== '0'){
                type2 = parseInt(aphone)
            }
            else {type2 = 0;}
        }
        catch (e) {
            type2 = 0
            return e
        }



        try {


            // type2 = isNullOrUndefined(toSend[0]['phone']) || toSend[0]['phone'] === 0 ? 0 : parseInt(toSend[0]['phone']);
            const ajson =
                {
                    score: toSend[0]['utme_aggregate'],
                    department:encodeURIComponent(toSend[0]['department']),
                    sub1: toSend[0]['subject_1'], sub2: toSend[0]['subject_2'], sub3: toSend[0]['subject_3']
                };

            let affiliateUpper = ['Federal college of education (technical) Umunze (FCETU)',
                'Enugu State College of Education (technical) (ESCET)',
                'Pope John Paul Seminary, Okpuno',
                'Auchi Polytechnic, Auchi, Delta State'
            ]
            let affiliateLower = ['Paul University, Awka',
                'Peter University, Achina-Onneh',
                'Legacy University, Okija']
            let recommend = {}
            let qualified = 1
            const url = pythonUrl + `/api/suggest-departments/${encodeURIComponent(JSON.stringify(ajson))}`;

            // handles affiliate recommendations
            if (type2) {
                if (ajson.score < 160) {qualified = 0}

                if (toSend[0]['utme_aggregate'] >= 160) {
                    const atype2 = type2.toString()
      
                      qualified = 1
                      recommend = {
                        Info: atype2 ==="1" ? "UMUNZE" :
                        (atype2 ==="2" ? "AUCHI":(atype2 ==="3" ? "POPE JOHN" : "ESCET"))
      
                      }
      
      
                  }
                  else if (toSend[0]['utme_aggregate'] >= 140) {
                    qualified = 0
                    recommend = {suggestAffiliate: affiliateLower}}

                toSend2 = {
                    reg_num: toSend[0]['reg_num'],
                    lastname: toSend[0]['fullname'].split(' ')[0],
                    firstname: toSend[0]['fullname'].split(' ')[1],
                    middlename: toSend[0]['fullname'].split(' ')[2] ? toSend[0]['fullname'].split(' ')[2] : '',
                    sex: toSend[0]['sex'],
                    state: toSend[0]['state'],
                    utme_aggregate: toSend[0]['utme_aggregate'],
                    department: toSend[0]['department'],
                    faculty: "",
                    lga: toSend[0]['lga'],
                    subject_1: toSend[0]['subject_1'],
                    subject_1_score: toSend[0]['subject_1_score'],
                    subject_2: toSend[0]['subject_2'],
                    subject_2_score: toSend[0]['subject_2_score'],
                    subject_3: toSend[0]['subject_3'],
                    subject_3_score: toSend[0]['subject_3_score'],
                    english_score: toSend[0]['english_score'],
                    student_type:(type === "UTME" ? 1 : 2),
                    recommendation: JSON.stringify(recommend),
                    qualified: qualified


                }
                projectM.push(toSend2)

                return toSend2
            }
            else
            {
                await fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        console.log("received from python");

                        if (data.combostatus !== 200) {qualified = 0}
                        if (!qualified) {
                            if (toSend[0]['utme_aggregate'] >= 160) {
                                if (data.suggest.length > 0) {
                                    recommend = {suggestedUnizikCourses: data.suggest}
                                }
                                else {
                                    recommend = {suggestAffiliate: affiliateUpper}
                                }

                            }
                            else if (toSend[0]['utme_aggregate'] >= 140) {recommend = {suggestAffiliate: affiliateLower}}
                        }

                        toSend2 = {
                            reg_num: toSend[0]['reg_num'],
                            lastname: toSend[0]['fullname'].split(' ')[0],
                            firstname: toSend[0]['fullname'].split(' ')[1],
                            middlename: toSend[0]['fullname'].split(' ')[2] ? toSend[0]['fullname'].split(' ')[2] : '',
                            sex: toSend[0]['sex'],
                            state: toSend[0]['state'],
                            utme_aggregate: toSend[0]['utme_aggregate'],
                            department: toSend[0]['department'],
                            faculty: "",
                            lga: toSend[0]['lga'],
                            subject_1: toSend[0]['subject_1'],
                            subject_1_score: toSend[0]['subject_1_score'],
                            subject_2: toSend[0]['subject_2'],
                            subject_2_score: toSend[0]['subject_2_score'],
                            subject_3: toSend[0]['subject_3'],
                            subject_3_score: toSend[0]['subject_3_score'],
                            english_score: toSend[0]['english_score'],
                            student_type:(type === "UTME" ? 1 : 2),
                            recommendation: JSON.stringify(recommend),
                            qualified: qualified


                        }

                        // console.log("TO SEND2", toSend2)

                        if (toSend2) {
                            // p2[ii+1] = toSend2
                            projectM.push(toSend2)
                            return toSend2
                            // return toSend2
                        }
                        else {
                            console.log("..error pushing to projectmanagers")
                            return null
                        }

                        // return toSend2


                    })
                    .catch(err => {
                        console.log("ERROR AT PYTHON GET")
                        return err

                    })

            } }
        catch (error) {

            console.log("Error, Failed to retrieve record")
            return error
        }

    }

    // return toSend2

}

app.route('/api/check-sent-chuka').get(onWhatIsSent)
async function onWhatIsSent(req, res) {

    const type = "UTME"
    var message = ""
    const regNo = req.query.regNo
    const projectM_temp = []
    const answer = 1
    await getStudentRegistrationInfo(0,regNo, type, projectM_temp)
    console.log('answer::', answer)
    if (answer) {

        res.status(200).json({
            studentRecord: projectM_temp,
            message: "student record found",



            status: 200
        });
        // }

    }
    else {
        res.status(202).json({
            studentRecord: projectM_temp,
            message: "student record not found, change to us",

            status: 202
        });
    }

}

// this api check to see if the student has passed the passmark and gets the student JAMB no details
// input the JAMB regNo
app.route('/api/check-valid-regno').get(onStudenRecordGet)
async function onStudenRecordGet(req, res) {
    const type = "UTME"
    var message = ""
    const regNo = req.query.regNo
    var r1
    console.log('...received request to grab student info', regNo)
    if (!regNo || regNo === "") {
        res.status(400).json({
            message: "Failed to retrieve record",
        });
    }
    else {
        r1 = await recordsFromATableGrab(type,regNo, mainTableName[type],true)
        console.log('...retrieved student record', r1)

        try {
            const toSend = r1.length < 1  ? undefined : r1


            const ajson =
                {
                    score: toSend[0]['utme_aggregate'],
                    // department:(toSend[0]['department']),

                    department:encodeURIComponent(toSend[0]['department']),
                    sub1: toSend[0]['subject_1'], sub2: toSend[0]['subject_2'], sub3: toSend[0]['subject_3']
                };

            var affiliateUpper = ['Federal college of education (technical) Umunze (FCETU)',
                'Enugu State College of Education (technical) (ESCET)',
                'Pope John Paul Seminary, Okpuno',
                'Auchi Polytechnic, Auchi, Delta State'
            ]
            var affiliateLower = ['Paul University, Awka',
                'Peter University, Achina-Onneh',
                'Legacy University, Okija']
            var recommend = {}
            var qualified = 1

            const headers = {
                "content-Type": "application/json",
                accept: 'application/json'
            }

            let options = {
                method:'GET',
                headers:headers,

            };
            const url = pythonUrl + `/api/suggest-departments/${encodeURIComponent(JSON.stringify(ajson))}`;
            await fetch(url)
                .then(response => response.json())
                .then(data => {
                    console.log("data from suggest dep::", data)

                    if (data.combostatus !== 200) {qualified = 0}
                    if (!qualified && data.combostatus === 202) {
                        if (toSend[0]['utme_aggregate'] >= 160) {
                            if (data.suggest.length > 0) {
                                recommend = {suggestedUnizikCourses: data.suggest}
                            }
                            else {
                                recommend = {suggestAffiliate: affiliateUpper}
                            }

                        }
                        else if (toSend[0]['utme_aggregate'] >= 140) {recommend = {suggestAffiliate: affiliateLower}}
                    }

                    const toSend2 = {
                        reg_num: toSend[0]['reg_num'],
                        lastname: toSend[0]['fullname'].split(' ')[0],
                        firstname: toSend[0]['fullname'].split(' ')[1],
                        middlename: toSend[0]['fullname'].split(' ')[2] ? toSend[0]['fullname'].split(' ')[2] : '',
                        sex: toSend[0]['sex'],
                        state: toSend[0]['state'],
                        utme_aggregate: toSend[0]['utme_aggregate'],
                        department: toSend[0]['department'],
                        faculty: "",

                        lga: toSend[0]['lga'],
                        subject_1: toSend[0]['subject_1'],
                        subject_1_score: toSend[0]['subject_1_score'],
                        subject_2: toSend[0]['subject_2'],
                        subject_2_score: toSend[0]['subject_2_score'],
                        subject_3: toSend[0]['subject_3'],
                        subject_3_score: toSend[0]['subject_3_score'],
                        english_score: toSend[0]['english_score'],
                        student_type:(type === "UTME" ? 1 : 2),
                        recommendation: JSON.stringify(recommend),
                        qualified: qualified


                    }

                    // console.log("TO SEND2", toSend2)

                    if (toSend2 && data.combostatus !== 500) {

                        res.status(200).json({
                            studentRecord: toSend2,
                            message: "student record found",



                            status: 200
                        });
                        // }

                    }
                    else {
                        res.status(202).json({
                            studentRecord: {},
                            message: "student record not found, change to us",

                            status: 202
                        });
                    }


                })
                .catch(err => {console.log("ERROR AT PYTHON GET")})


        } catch (error) {
            res.status(500).json({
                message: "Error, Failed to retrieve record",
            });
        }
    }

}

app.get('/api/match-state', (req, res, next) => {})

app.get('/api/match-utme-aggregate', (req, res, next) => {})

app.get('/api/match-eng-score', (req, res, next) => {})

// app.get('/api/check-dept-cutoff', (req, res, next) => {})

app.route('/api/check-dept-cutoff').get(onGetDepartmentCutOff)
async function onGetDepartmentCutOff(req, res) {
    const type = 'UTME'
    const department = req.query.department
    // const tableName = ""
    console.log('...received request for cutoff for department')

    // console.log('received department to query:::', req.query.department)
    const r1 = await grabDepartmentCutoff(type,department,'uaras_dept_cutoff')

    // console.log('retrieved No:::', req.query.regNo)
    // console.log('...retrieved cutoff:::', r1)
    console.log('...retrieved cutoff for department')
    try {
        const toSend = r1.length < 1  ? undefined : r1
        // console.log('toSend', toSend)
        if (toSend) {
            res.status(200).json({
                data: toSend, status: 200
            });
        }
        else {
            res.status(202).json({
                data: toSend, status: 202
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve record",
        });
    }
}

app.route('/api/check-depts-cutoff').get(onGetDepartmentsCutOff)
async function onGetDepartmentsCutOff(req, res) {
    const type = 'UTME'

    const r1 = await grabDepartmentsCutoff(type,'uaras_dept_cutoff')

    // console.log('retrieved No:::', req.query.regNo)
    // console.log('.....retrieved cutoff:::', r1)
    console.log('.....retrieved cutoff:::')
    try {
        const toSend = r1.length < 1  ? undefined : r1
        // console.log('toSend', toSend)
        if (toSend) {
            res.status(200).json({
                data: toSend, status: 200
            });
        }
        else {
            res.status(202).json({
                data: toSend, status: 202
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve record",
        });
    }
}

app.route('/api/get-admissionlist').get(onGetAdmissionList)
async function onGetAdmissionList(req, res) {
    const type = 'UTME'

    const r1 = await grabDepartmentsCutoff(type,'uaras_dept_cutoff')

    // console.log('retrieved No:::', req.query.regNo)
    // console.log('.....retrieved cutoff:::', r1)
    console.log('.....retrieved cutoff:::')
    try {
        const toSend = r1.length < 1  ? undefined : r1
        // console.log('toSend', toSend)
        if (toSend) {
            res.status(200).json({
                data: toSend, status: 200
            });
        }
        else {
            res.status(202).json({
                data: toSend, status: 202
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve record",
        });
    }
}


app.get('/api/check-subj-combo', (req, res, next) => {})

//get maximum on main table
// for loop that takes from one to the end and sends them in batches of 500


// admission functions
function comparePUTMEScore(studentPUTMEScore, departmentPUTMEpassmark) {
    let answer = false;
    if (studentPUTMEScore >= departmentPUTMEpassmark) {answer = true;}
    return answer;
}

// add Quota
function setQuota(quota, departmentCode) {
    // go to the quota main table and set the quota associated with the department to the value
    let answer = false;
    return answer;
}

function manageQuota(instruction, value, quota_type, departmentCode) {
    // go to the quota working table and set the quota associated with the department to increase or decrease by the value
    let answer = false;
    return answer;
}

function calculateQuotaValueDepartment(quota, departmentCode) {
    // go to the quota main table and using the set quota value, work out the other sub quota for the department
    //  ie utme_quota_90, de_quota_10, utme_quota_90_45 etc
    let answer = false;
    return answer;
}

function calculateQuotaValue() {
    // runs a for loop of calculateQuotaValueDepartment for the entire main table
    let answer = false;
    return answer;
}

function syncQuotaValues() {
    // this synchronises main table updates with the working table as long as a row has not been updated on the working table
}

function checkQuotaValuesthatHaveChanged() {
    // this function returns the quota values that are eligible for the syncQuotaValues function
}

function processQuotaList() {
    // gets data from the post utme database /api and store sorted data according to the calculated average in the year_utme_sorted table
}

async function calculateMerit() {
    // update admission status of the first utme_90_45 to merit
}

// async function getCountOf

async function processAdmissionsList4PUTMEdata() {
    let type = "UTMEREG"
    // go through each item on the UTME table..
    // check if the regNo exists on the reg table- if it does check to see if the date on the UTME table is later
    //  if it is replace the details with the up to date one
    // check if it meets passmark and subject combo...
    // break the full names to lastname, firstname and middlename
    // add the records to the UTME registration
    makeConnection()
    // check if temp table exists // delete if it exists
    if (!await checkTableExists(mainTableName["UTME"])) {
        console.log("You cannot process registration without a candidate table from JAMB")
    }
    else{
        if (!await checkTableExists(mainTableName[type])) {
            console.log('the registration table does not exist')
            await createTable(type, mainTableName[type])




        }
        else {
            // delete existing table
            // do the processing registration tab
        }

    }

    // create temp table
    await createTable(type,tempTableName[type])
    if (tempUTME && tempUTME[type]) {
        await addRecords(type,tempTableName[type])
    }
    if (await checkTableExists(mainTableName[type])) {
        await matchUTMECandidateHash(type,mainTableName[type], tempTableName[type])
    }
    else {
        await createTable(mainTableName[type])
        await addRecords(type,mainTableName[type])
    }
    closeConnection()

}

app.route('/api/get-passmark').get(getPassmark)
async function getPassmark(req, res) {
    var condition = 0
    try {condition = req.query.option}
    catch {console.log("error reading error")}
    // var condition = req.query.option
    var queryTemp = "SELECT * FROM uaras_utme_passmark"
    if (condition !== 1) {queryTemp = `SELECT passmark FROM uaras_utme_passmark WHERE current = true`;}
    const answer = await doQuery(queryTemp)
    console.log('.....retrieved passmark:::')
    try {
        const toSend = answer.length < 1  ? undefined : answer
        if (toSend) {
            res.status(200).json({
                data: toSend, status: 200
            });
        }
        else {
            res.status(202).json({
                data: toSend, status: 202
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve record",
        });
    }
}

// set passmark
async function setPassmark2(passNumber, passyear, current, condition) {
    var queryTemp = ""
    if (condition) {queryTemp = `
  INSERT INTO uaras_utme_passmark (id, passmark,year, current, edited)
  VALUES (NULL, ${passNumber}, '${passyear}', '1', CURRENT_TIMESTAMP);
  `;}
    else {
        queryTemp = `UPDATE uaras_utme_passmark
    SET
    passmark = ${passNumber},
    current = ${current},
    WHERE year = '${passyear}'`;

    }
    const answer = await doQuery(queryTemp)
    return answer
}

app.route('/api/set-passmark').post(setPassmark)
async function setPassmark(req, res) {
    const record = JSON.parse(req.body[0]);
    var condition = req.body[1]
    var queryTemp = ""
    if (condition !== 1) {queryTemp = `
  INSERT INTO uaras_utme_passmark (id, passmark,year, current, edited)
  VALUES (NULL, ${record.passmark}, '${record.year}', ${record.current}, CURRENT_TIMESTAMP);
  `;}
    else {
        queryTemp = `UPDATE uaras_utme_passmark
    SET
    passmark = ${record.passmark},
    current = ${record.current}
    WHERE uaras_utme_passmark.year = '${record.year}'`
    }

    try {
        const answer = await doQuery(queryTemp)
        console.log('.....post/update passmark:::')
        res.status(200).json({
            data: 1, status: 200
        });
        // }

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve record",
            status: 500
        });
    }
}

app.route('/api/del-passmark').post(delPassmark)
async function delPassmark(req, res) {
    const record = JSON.parse(req.body[0]);
    console.log("RECORD:::",record)
    // var condition = req.body[1]
    var queryTemp = `DELETE FROM uaras_utme_passmark WHERE uaras_utme_passmark.year = '${record.year}'`


    try {
        await doQuery(queryTemp)
        console.log('.....del passmark:::')
        res.status(200).json({
            data: 1, status: 200
        });
        // }

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete record",
            status: 500
        });
    }
}

// get cuttoff

// set cuttoff

// get main quota

// set main quota

// set working quota (bulk)

// set working quota (single)

// update working quota (single)


// check to see what students have not been uploaded and try to reupload
// steps
async function checkPush2Chuka4Issues() {
    const theMainTableReg = await getAllRegNoMain(0);
    const thePushedTableReg = await getAllRegNoMain(0,undefined, undefined,undefined,'POSTSTATUS')

    console.log('.....In test:::')
    const difference = []
    theMainTableReg.forEach(reg => {
        let obj = thePushedTableReg.find(y =>y['reg_num'] === reg['reg_num'] )
        // console.log('obj', obj, reg)
        if (!obj) {
            difference.push(reg['reg_num'])
        }
    })
    return {
        "theMainTableReg": theMainTableReg.length,
        "thePushedTableReg": thePushedTableReg.length,
        "difference": difference
    }
}
async function checkPush2ChukaDifference(req,res) {
    const issues = await checkPush2Chuka4Issues()

    try {

        if (issues.theMainTableReg > 0 && issues.thePushedTableReg > 0) {
            res.status(200).json({
                data: issues,
                status: 200
            });
        }
        else {
            res.status(202).json({
                data: {}, status: 202
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve tests results",
        });
    }
}
app.route('/api/tests').get(checkPush2ChukaDifference)

app.route('/api/push-to-chuka-save-errors').get(onStudentsRecordSendSaveErrors)
async function onStudentsRecordSendSaveErrors(req, res) {
    let type = 'UTME';
    let batchNo = 100;
    let currentBatch = 0;
    let itemNo = 0;
    var projectManagers = []
    var issuesBatches = []
    // const start = req.query.start
    // const stop = req.query.stop
    // const dateLast = req.query.datelast
    // const bSize = req.query.batchsize
    // const delayspec = req.query.delays
    // const course = req.query.course
    // if (bSize) {
    //     batchNo = bSize
    // }
    // if (delayspec) {delays = delayspec}

    const issues = await checkPush2Chuka4Issues()
    // await makeConnection()


    // console.log("AWAIT REGNOS RESULT")

    // const regNoList = await getAllRegNoMain(start, stop, dateLast, course)
    var total = 0
    try {
        total = issues.difference.length;
        // console.log("REGNOS RESULT",regNoList)

    } catch  {
        console.log('No students found within this search parameters')
    }
    //  var total = regNoList.length;
    console.log("REGNOS RESULT",total)

    //  batchCondition[2] = total

    let oldtkMessage = ""

    // if (!await checkTableExists(`uaras_saved_utme_candidate_status`)) {
    //     // await matchUTMECandidateHashSaved(type,`uaras_saved_utme_candidate_status`,toSendSample)
    //     await createTable(type,`uaras_saved_utme_candidate_status`)
    //
    // }
    
    console.log('here are all the regNos-', issues.difference)
    for (let i = 0; i < total ; i++) {

        const aRegNo = (issues.difference)[i]
        batchCondition[1] = i
        const response = await requestWithRetry (i,aRegNo,type, projectManagers)
        console.log("this is projectManagers", projectManagers)
        await saveDetailsOfPush('SAVEUTMESTATUS', projectManagers[itemNo])
        if (i % batchNo === 0 && i !== 0) {
            currentBatch += 1
            batchCondition[0] = currentBatch

            const copyprojectManagers = projectManagers
            projectManagers = []
            itemNo = 0
            // await waitForServerProcess(delays)

            const answerToken = await postChukaBatch(copyprojectManagers, issuesBatches)
            if (currentBatch === 1){
                console.log(copyprojectManagers);

            }
            // issuesBatches = []

        }
        else if(i+ 1 === total){
            currentBatch += 1
            batchCondition[0] = currentBatch
            // await waitForServerProcess(delays)
            const copyprojectManagers = projectManagers
            const answerToken = await postChukaBatch(copyprojectManagers, issuesBatches)// const waitanswer = await waitForServerProcess(delays)
            console.log('total number sent in this batch::', copyprojectManagers.length)
        }
        else{itemNo = itemNo + 1}
        console.log("COUNT OF PM::", itemNo)
        // projectManagers = []
        // console.log("this is i", i)

    }
    // await closeConnection()

    console.log("ISSUES----------")
    console.log(issuesBatches)
    console.log("ISSUES----------")

    try {
        res.status(200).json({
            message: `post qualified successful `,
            count:total,
            status: 200
        });

    }
    catch (error) {
        res.status(500).json({
            message: "Error, Failed to send from batch of the record",
        });
    }


}


module.exports = app;
