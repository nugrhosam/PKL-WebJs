var express = require('express')
var permintaan = express.Router()
var cors = require('cors')
var dbconn = require('../database/database')
var jwt = require('jsonwebtoken')
var token;

var token = jwt.sign({ data: {logged_in : false}}, 'secret_token', { expiresIn: '1d' })
permintaan.use(cors())
var appData = {}
var options = {
    root: './src/views/'
}

var now = new Date();
var year = "" + now.getFullYear();
var month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
var day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
var hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
var minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
var second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }

permintaan.use((req, res, next) => {
    if(!req.cookies.token){
        var fileName = 'login.html'
            res.sendfile(fileName, options, (err) => {
                if(err){
                    console.log(err)
                }  
        })
    }else{
        token = req.cookies.token
        var decoded = {
            logged_in : false
        }
        
        try {
            decoded = jwt.verify(token, 'secret_token')
        }
        catch (error) {
            var fileName = 'login.html'
            res.sendfile(fileName, options, (err) => {
                if(err){
                    console.log(err)
                }  
            })
        }
        if(decoded.logged_in){
            next()
        }else{
            var fileName = 'login.html'
            res.sendfile(fileName, options, (err) => {
                if(err){
                    console.log(err)
                }  
            })
        }
    }
})

permintaan.get('/', (req, res) => {
    var fileName = 'permintaan.html'
    res.sendfile(fileName, options, (err) => {
        if(err){
            console.log(err)
        }  
    })
})

permintaan.post('/save', async (req, res) => {
    
    var datetime = Date.now()
    var id_permintaan = 'perm'+datetime
    var datetime_format = year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;

    var data = req.body
    var nomor_surat = data.nomor_surat
    var tanggal = data.tanggal
    var divisi = data.divisi
    var nama_peminta = data.nama_peminta
    var status = data.status
    var buat_pada = datetime_format
    var ubah_pada = datetime_format

    var detail = data.detail
    var panjang_detail = detail.length
    
    try{
        var sql = 'INSERT INTO permintaan (id_permintaan, nomor_surat, tanggal, divisi, nama_peminta, status, buat_pada, ubah_pada) VALUES (\''+id_permintaan+'\', \''+nomor_surat+'\', \''+tanggal+'\', \''+divisi+'\', \''+nama_peminta+'\', \''+status+'\', \''+buat_pada+'\', \''+ubah_pada+'\')';
        await dbconn.query(sql, (err) => {
            if(err){
                res.status(200).json({status : false})
            }else{
                sql = 'INSERT INTO detail_permintaan VALUES ' 

                for(i = 0; i < panjang_detail; i++){
                    if(i != (panjang_detail-1)){
                        sql = sql+'( \''+id_permintaan+'\', \''+detail[i][0]+'\', \''+detail[i][1]+'\', \''+detail[i][2]+'\', \''+detail[i][3]+'\'), '
                    }else{
                        sql = sql+'( \''+id_permintaan+'\', \''+detail[i][0]+'\', \''+detail[i][1]+'\', \''+detail[i][2]+'\', \''+detail[i][3]+'\') '
                    }

                }

                dbconn.query(sql, (err) => {
                    if(err){
                        res.status(200).json({status : false})
                    }else{
                        res.status(200).json({status : true})
                    }
                })
            }
        })
    } catch(err) {
        res.status(400).json({
            status : false
        })
    }
})

permintaan.get('/find', async (req, res) => {

    var panjang_baris = req.query.length
    var awal_baris = req.query.start
    var pencarian = req.query.search
    var isi_pencarian = pencarian['value']
    var order = req.query.order
    var order_kolom = order['0'].column;
    var tipe_order = order['0'].dir
    var draw = req.query.draw
    
    var kolom = ['nomor_surat', 'tanggal', 'divisi', 'nama_peminta', 'status']

    if(order_kolom == '0'){
        order_kolom = 'id_permintaan'
        tipe_order = 'desc'
    }else{
        order_kolom = kolom[order_kolom]
    }

    var sql = "SELECT * FROM permintaan WHERE ( nomor_surat like '%"+isi_pencarian+"%' OR tanggal like '%"+isi_pencarian+"%' OR divisi like '%"+isi_pencarian+"%' OR nama_peminta like '%"+isi_pencarian+"%') ORDER BY "+order_kolom+" "+tipe_order+" LIMIT "+panjang_baris+" OFFSET "+awal_baris
    
    var data = new Array()
    var recordsFiltered = 0
    var recordsTotal = 0

    try{
        await dbconn.query(sql, (err, resquery) => {
                if (err) {
                    var json_return = {
                        draw : draw,
                        recordsTotal : 0,
                        recordsFiltered : 0,
                        data : [],
                        message : err
                    }
                    res.status(200).json(json_return)
                }else{
                        var i = 0;
                        resquery.rows.forEach((item) => {
                            var script_html = '<i class="left fa fa-pencil" style="cursor : pointer" onClick="ubah_modal(\''+item.id_permintaan+'\')"></i><span style="cursor : pointer" onClick="ubah_modal(\''+item.id_permintaan+'\')"> Edit</span> <i class="left fa fa-eye" style="cursor : pointer" onClick="detail_modal(\''+item.id_permintaan+'\')"></i><span style="cursor : pointer" onClick="detail_modal(\''+item.id_permintaan+'\')"> Detail</span>'
                            var data_table = [item.nomor_surat, item.tanggal, item.divisi, item.nama_peminta, item.status, script_html]
                            data[i] = data_table
                            i++
                        })

                        sql = "SELECT * FROM permintaan"
                        dbconn.query(sql,  (err, resquery) => {
                            if (err) {
                                var json_return = {
                                    draw : draw,
                                    recordsTotal : 0,
                                    recordsFiltered : 0,
                                    data : [],
                                    message : err
                                }
                                res.status(200).json(json_return)
                            }else{  
                                recordsTotal = resquery.rows.length

                                sql = "SELECT * FROM permintaan WHERE ( nomor_surat like '%"+isi_pencarian+"%' OR tanggal like '%"+isi_pencarian+"%' OR divisi like '%"+isi_pencarian+"%' OR nama_peminta like '%"+isi_pencarian+"%') ORDER BY "+order_kolom
                                dbconn.query(sql,  (err, resquery) => {
                                        if (err) {
                                            var json_return = {
                                                draw : draw,
                                                recordsTotal : 0,
                                                recordsFiltered : 0,
                                                data : [],
                                                message : err
                                            }
                                            res.status(200).json(json_return)
                                        }else{  
                                            recordsFiltered = resquery.rows.length
                                            var json_return = {
                                                draw : draw,
                                                recordsTotal : recordsTotal,
                                                recordsFiltered : recordsFiltered,
                                                data : data
                                            }

                                            res.status(200).json(json_return)
                                        }
                                    }
                                )
                            }
                        }
                    )
                }
            }
        )
    } catch (err){
        var json_return = {
            draw : draw,
            recordsTotal : recordsTotal,
            recordsFiltered : recordsFiltered,
            data : data
        }
        res.status(200).json(json_return)
    }
})

permintaan.get('/find/:id', async (req, res) => {

    var id = req.params.id
    
    try{
        var sql = 'SELECT * FROM permintaan WHERE id_permintaan = \''+id+'\''
        await dbconn.query(sql, (err, resquery) => {
                if(err){
                    var json_return = {
                        draw : 0,
                        recordsTotal : 0,
                        recordsFiltered : 0,
                        data : [],
                        message: err
                    }
                    res.status(200).json(json_return)
                }else{
                    var json_return = {
                        status : true,
                        id_permintaan : resquery.rows[0].id_permintaan,
                        nomor_surat : resquery.rows[0].nomor_surat,
                        tanggal : resquery.rows[0].tanggal,
                        divisi : resquery.rows[0].divisi,
                        nama_peminta : resquery.rows[0].nama_peminta,
                        status_permintaan : resquery.rows[0].status,
                        detail : []
                    }
                    sql = 'SELECT * FROM detail_permintaan WHERE id_permintaan = \''+id+'\''
                    dbconn.query(sql, (err, resquery2) => {
                            if(err){
                                res.status(200).json({
                                    status : false
                                })
                            }else{
                                json_return.detail = resquery2.rows
                                res.status(200).json(json_return)
                            }
                        }
                    )
                }
            }
        )
    }catch (err) {
        var json_return = {satus : false}
        res.status(400).json(json_return)
    }
})

permintaan.post('/update/:id', async (req, res) => {

    var id_permintaan = req.params.id
    var datetime_format = year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;

    var data = req.body
    var nomor_surat = data.nomor_surat
    var tanggal = data.tanggal
    var divisi = data.divisi
    var nama_peminta = data.nama_peminta
    var status = data.status
    var ubah_pada = datetime_format

    var detail = data.detail
    var panjang_detail = detail.length
    
    try{
        var sql = 'UPDATE permintaan SET nomor_surat = \''+nomor_surat+'\', tanggal =  \''+tanggal+'\', divisi = \''+divisi+'\', nama_peminta = \''+nama_peminta+'\', status = \''+status+'\', ubah_pada = \''+ubah_pada+'\' WHERE id_permintaan = \''+id_permintaan+'\'';
        await dbconn.query(sql, (err) => {
            if(err){
                res.status(200).json({status : false, message : err})
            }else{
                sql = 'DELETE FROM detail_permintaan WHERE id_permintaan = \''+id_permintaan+'\''
                dbconn.query(sql, (err) => {
                    if(err){                
                        res.status(200).json({status : false, trace : 'pada delete', message : err})
                    }else{
                        sql = 'INSERT INTO detail_permintaan VALUES ' 
                        for(i = 0; i < panjang_detail; i++){
                            if(i != (panjang_detail-1)){
                                sql = sql+'( \''+id_permintaan+'\', \''+detail[i][0]+'\', \''+detail[i][1]+'\', \''+detail[i][2]+'\', \''+detail[i][3]+'\'), '
                            }else{
                                sql = sql+'( \''+id_permintaan+'\', \''+detail[i][0]+'\', \''+detail[i][1]+'\', \''+detail[i][2]+'\', \''+detail[i][3]+'\') '
                            }

                        }
                        dbconn.query(sql, (err) => {
                            if(err){
                                res.status(200).json({status : false, message : err})
                            }else{
                                res.status(200).json({status : true})
                            }
                        })
                    }
                })
            }
        })
    } catch(err) {
        res.status(400).json({
            status : false
        })
    }
})

module.exports = permintaan;