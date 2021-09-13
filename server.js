const express = require('express');
const app = express();
const http = require('http')
const server = http.createServer(app)

const fs = require('fs');



app.set('view engine', 'ejs');

// Routes
app.use('/', require('./routes/index'));

// port setting
server.listen(8000, function(){
    // 폴더가 있는지 확인하고 없으면 폴더 생성
    var dir = './uploadedFiles';
    if(!fs.existsSync(dir)){ 
        fs.mkdirSync(dir)
    }

    console.log('서버 연결 성공!')
})

