/* eslint-disable quote-props */
/* eslint-disable quotes */
/* eslint-disable linebreak-style */
/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const { Contract, Context } = require('fabric-contract-api');
const PatientRecord = require('./patientrecord.js');
const PatientRecordList = require('./patientrecordlist.js');


class PatientRecordContext extends Context {

    constructor() {
        super();
        this.patientRecordList = new PatientRecordList(this);
    }

}


class PatientRecordContract extends Contract {

    constructor() {
        super('edu.asu.patientrecordcontract');
    }

    /**
     * Define a custom context for commercial paper
    */
    createContext() {
        return new PatientRecordContext();
    }

    /**
     * @param {Context} ctx the transaction context
     */
    async init(ctx) {
        console.log('Instantiated the patient record smart contract.');
    }

    async unknownTransaction(ctx) {
        throw new Error('Function name missing');
    }

    async afterTransaction(ctx) {
        console.log('---------------------INSIDE afterTransaction-----------------------')
        let func_and_params = ctx.stub.getFunctionAndParameters()
        console.log('---------------------func_and_params-----------------------')
        console.log(func_and_params)
        console.log(func_and_params['fcn'] === 'createPatientRecord' && func_and_params['params'][4] === 'AB-')
        if (func_and_params['fcn'] === 'createPatientRecord' && func_and_params['params'][4] === 'AB-') {
            ctx.stub.setEvent('rare-blood-type', JSON.stringify({ 'username': func_and_params.params[0] }))
            console.log('Chaincode event is being created!')
        }

    }
    /**
     * @param {Context} ctx the transaction context
     * @param {String} username username
     * @param {String} name name
     * @param {String} dob date of birth
     * @param {String} gender  gender
     * @param {String} blood_type blood type
     */
    async createPatientRecord(ctx, username, name, dob, gender, blood_type) {
        let precord = PatientRecord.createInstance(username, name, dob, gender, blood_type);
        //TASK 0
        // Add patient record by calling the method in the PRecordList
        ctx.patientRecordList.addPRecord(precord)
        //throw new Error()
        return precord.toBuffer();
    }

    async getPatientByKey(ctx, username, name) {
        let precordKey = PatientRecord.makeKey([username, name]);
        //TASK-1: Use a method from patientRecordList to read a record by key
        let precord = await ctx.patientRecordList.getPRecord(precordKey);
        return JSON.stringify(precord)
    }


    /**
     * @param {Context} ctx the transaction context
     * @param {String} username username
     * @param {String} name name
     * @param {String} lastCheckupDate date string 
     */
    async updateCheckupDate(ctx, username, name, lastCheckupDate) {
        let precordKey = PatientRecord.makeKey([username, name]);
        let precord = await ctx.patientRecordList.getPRecord(precordKey);
        precord.setlastCheckupDate(lastCheckupDate);
        await ctx.patientRecordList.updatePRecord(precord);
        return precord.toBuffer();
    }



    /**
     * @param {Context} ctx the transaction context
     * @param {String} queryString the query string to be evaluated
    */
    async queryWithQueryString(ctx, queryString) {

        console.log("query String");
        console.log(JSON.stringify(queryString));

        let resultsIterator = await ctx.stub.getQueryResult(queryString);

        let allResults = [];

        while (true) {
            let res = await resultsIterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};

                console.log(res.value.value.toString('utf8'));

                jsonRes.Key = res.value.key;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }

                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await resultsIterator.close();
                console.info(allResults);
                console.log(JSON.stringify(allResults));
                return JSON.stringify(allResults);
            }
        }

    }

    /**
     * @param {Context} ctx the transaction context
     * @param {String} gender gender to be queried
    */

    async queryByGender(ctx, gender) {
        let queryGender = {};
        queryGender.selector = {};
        queryGender.selector.gender = gender
        queryGender = JSON.stringify(queryGender)
        return await this.queryWithQueryString(ctx, queryGender);




    }

    /**
     * Query by Blood_Type
     *
     * @param {Context} ctx the transaction context
     * @param {String} blood_type blood_type to queried
    */

    async queryByBlood_Type(ctx, blood_type) {

        let queryBlood_Type = {};
        queryBlood_Type.selector = {};
        queryBlood_Type.selector.blood_type = blood_type
        queryBlood_Type = JSON.stringify(queryBlood_Type)
        return await this.queryWithQueryString(ctx, queryBlood_Type);
 }

    
    **
     * @param {Context} ctx the transaction context
     * @param {String} blood_type blood_type to queried
    */

     async queryByBlood_Type_Dual(ctx, blood_type1, blood_type2) {
        let queryBlood_Type_Dual = {};
        queryBlood_Type_Dual.selector = {};
        queryBlood_Type_Dual.selector.blood_type = { blood_type1: {"$and": blood_type2} };
        queryBlood_Type_Dual.ddoc = "blood_typeIndexDoc";
        queryBlood_Type_Dual.use_index = {'fields':['blood_type']}
        queryBlood_Type_Dual = JSON.stringify(queryBlood_Type_Dual)
        console.log(queryBlood_Type_Dual);
        return await this.queryWithQueryString(ctx, queryBlood_Type_Dual);
  
  }

}


module.exports = PatientRecordContract;
