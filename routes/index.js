const express = require('express');
const router = express.Router();


const multer = require('multer');
const fs = require('fs');



/* 파일의 이름을 관리하기 위해 multer의 diskStorage 함수로 
    디렉터리와 파일명에 대한 객체를 생성해서, 
    업로드 객체를 생성할때 storage 멤버로 전달하면 된다.*/
const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, "uploadedFiles/")
  },
  filename(req, file, callback) {

    callback(null, file.originalname) // 전송자가 보낸 원래 이름으로 저장
  }
});
const upload = multer({storage : storage});



/* --------- DB --------- */
const mongoose = require('mongoose');

// models
const DBData = require("../routes/schema")


// db에 연결
mongoose.set("useFindAndModify", false);


// 데이터베이스 연결 정보
const uri = 'mongodb://localhost:27017';



// 연결
mongoose.connect(uri, {useNewUrlParser : true, useUnifiedTopology: true}, () => {

  console.log('DB 연결 성공!')

})
/* --------- DB --------- */





// 기본 페이지
router.get('/', function(req,res){

  res.render('index');

});




// 업로드 페이지
router.post('/upload_page', upload.single('file'), (req, res) => {


  /* 
  router.post('/upload_page', upload.array('file'), (req, res)
    설정 후 .ejs의 name="file"이 있는 곳에 multiple이라고 써주면
    파일을 여러개 한번에 보낼 수 있다.

  */


  const fileObj = req.file;
  const orgFileName = fileObj.originalname; //원본 파일명 저장

  const saveFileName = fileObj.name // 저장된 파일명

  // 추출한 데이터를 Object에 담는다.
  const obj = {
    "orgFileName" : orgFileName,
    "saveFileName" : saveFileName,
  }

  // DBData 객체에 담는다. (DBData는 mongoose의 schema를 모델화한 객체)
  const newData = new DBData(obj);

  try{
    
    newData.save();

    res.redirect("/");


  }catch(err){
    console.error(err)

    res.redirect("/");
  }


  console.log('파일 업로드 성공');

 
});




// const storage  = multer.diskStorage({ // 2
//     destination(req, file, cb) {
//       cb(null, 'uploadedFiles/');
//     },
//     filename(req, file, cb) {
//       cb(null, `${Date.now()}__${file.originalname}`);
//     },
//   });
//   const upload = multer({ dest: 'uploadedFiles/' }); // 3-1
//   const uploadWithOriginalFilename = multer({ storage: storage }); // 3-2
  
//   router.get('/', function(req,res){
//     res.render('upload');
//   });
  
//   router.post('/uploadFile', upload.single('attachment'), function(req,res){ // 4 
//     res.render('confirmation', { file:req.file, files:null });
//   });

  

  module.exports = router;