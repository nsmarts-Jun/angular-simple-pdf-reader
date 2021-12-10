# angular-simple-pdf-reader

## 개요

웹 클라이언트 프레임워크인 Angular를 이용해, 국제 표준 전자 문서 형식인 PDF를 읽기, 저장, 공유 가능한 웹 서비스를 개발.

## 환경설정

| name | version |
|---|---|
| Angular | 12.2.9 |
| Node | v14.17.3 |
| Npm | 6.14.13 |

## 실행

```
ng serve
```

![image](https://user-images.githubusercontent.com/91445932/146306759-729e253b-12e8-4c4f-b36f-84630571575c.png)

#### 파일 업로드

Open File 클릭, PDF 업로드

![image](https://user-images.githubusercontent.com/91445932/146306807-0acc58d5-c162-4bb3-8e8d-9203ae8496df.png)


#### 줌 기능

Fab Button 클릭, 버튼에 따라 너비,길이,비율에 맞게 이미지 썸네일 렌더링

![image](https://user-images.githubusercontent.com/91445932/146307747-3d05ec56-bb00-4e11-8cb0-b1c61e776d61.png)


const { ObjectId } = require('bson');
const { db } = require('../../../../../models/meeting_schema');

exports.getSpace = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Get my Space
  router.get(/space/:spaceTime', spaceController.getSpace);
  Params: ${req.params.spaceTime}
--------------------------------------------------`);
	const dbModels = global.DB_MODELS;

	try {

		// console.log(spaceNav);
		// https://crmrelease.tistory.com/131 파이프라인
		const spaceMembers = await dbModels.Space.aggregate([
			{
				$match: {
					$expr: {
						$eq: ['$spaceTime', req.params.spaceTime]
					}
				}
			},
			{
				$addFields: {
					isAdmin: {
						$cond: [
							{ $in: [ObjectId(req.decoded._id), '$admins'] },
							true,
							false,
						]
					},
				}
			},
			{
				$lookup: {
					from: 'members',
					let: {
						memberArray: '$members'
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$in: ['$_id', '$$memberArray']
								}
							}
						},
						{
							$project: {
								email: 1,
								name: 1,
								profile_img: 1
							}
						}
					],
					as: 'memberObjects'
				}
			},
			{
				$project: {
					displayName: 1,
					displayBrief: 1,
					spaceTime: 1,
					isAdmin: 1,
					memberObjects: 1,
					admins: 1
				}
			}

		]);

		// list of docs START
		const criteria = {
			spaceTime_id: req.params.spaceTime
		}

		const spaceDocs = await dbModels.Document.aggregate([
			{
				$match: {
					spaceTime_id: req.params.spaceTime
				}
			},
			{
				$lookup: {
					from: 'members',
					let: {
						creator_id: '$creator'
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ['$_id','$$creator_id']
								}
							} 
						},
						{
							$project: {
								name: 1
							}
						}
					],
					as: 'creator'
				},
				
			},
			{
				$unwind: {
					path: '$creator',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$project: {
					docTitle: 1,
					docContent: 1,
					spaceTime_id: 1,
					status: 1,
					creator: '$creator.name',
					createdAt: 1,
				}
			}
		]);

		// console.log(spaceMembers);
		// console.log(spaceDocs);
		return res.status(200).send({
			message: 'getSpace',
			spaceMembers,
			spaceDocs
		})


	} catch (err) {

		console.log('[ ERROR ]', err);
		res.status(500).send({
			message: 'loadUpateMenu Error'
		})
	}

}

exports.getDocs = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Get my docs
  router.get(/space/getDocs/:spaceTime', spaceController.getDocs);
  Params: ${req.params.spaceTime}
--------------------------------------------------`);
	const dbModels = global.DB_MODELS;

	try {
		
		// const criteria = {
		// 	spaceTime_id: req.params.spaceTime
		// }

		// const spaceDocs = await dbModels.Document.find(criteria);

		// console.log(spaceDocs);

		return res.status(200).send({
			message: 'getDocs',

		})
		

	} catch (err) {

		console.log('[ ERROR ]', err);
		res.status(500).send({
			message: 'Loadings Docs Error'
		})
	}
}

exports.changeSpaceName = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Change my Space Name
  router.put('/change-space-name', spaceController.changeSpaceName);
--------------------------------------------------`);
	const dbModels = global.DB_MODELS;

	data = req.body;
	console.log(data);

	const criteria = {
		_id: data.id
	}

	const updateData = {
		displayName: data.displayName
	}

	// 휴가 승인 업데이트
	try {
		const updatedDisplayName = await dbModels.Space.findOneAndUpdate(criteria, updateData);
		if (!updatedDisplayName) {
			return res.status(404).send('the update1 has failed');
		}

		console.log(updatedDisplayName);

		return res.status(200).send({
			message: "connect changeSpaceName",
		});

	} catch (error) {
		return res.status(500).send({
			message: 'DB Error'
		});
	}
}

exports.changeSpaceBrief = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Change my Space Brief
  router.put('/change-space-name', spaceController.changeSpaceBrief);
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;
	data = req.body;
	console.log(data);

	const criteria = {
		_id: data.id
	}

	const updateData = {
		displayBrief: data.displayBrief
	}

	// 휴가 승인 업데이트
	try {
		const updatedDisplayName = await dbModels.Space.findOneAndUpdate(criteria, updateData);
		if (!updatedDisplayName) {
			return res.status(404).send('the update1 has failed');
		}

		console.log(updatedDisplayName);

		return res.status(200).send({
			message: "connect changeSpaceName",
		});

	} catch (error) {
		return res.status(500).send({
			message: 'DB Error'
		});
	}
}

exports.deleteSpaceMember = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Delete Space Memeber
  router.put('/delete-space-member', spaceController.deleteSpaceMember);
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;
	data = req.body;
	console.log(data);

	const updateDeleteMember = await dbModels.Space.findOneAndUpdate(
		{
			_id: ObjectId(data.id)
		},
		{
			$pull: { members: ObjectId(data.member_id)}
		}
	)
	console.log(updateDeleteMember);
	const getDocId = await dbModels.Document.aggregate([
		{
			$match: {
				spaceTime_id: updateDeleteMember.spaceTime
			}
		},
		{
			$project: {
				_id: 1,
			}
		}
	]);

	console.log(getDocId);
	for (let index = 0; index < getDocId.length; index++) {
		const element = getDocId[index]._id;
		console.log(element)
		const enlistMeeting = await dbModels.Meeting.updateMany(
			{
				docId: element
			},
			{
				$pull: { enlistedMembers: data.member_id }
			}
		)
	}

	return res.status(200).send({
		message: 'deleteSpaceMember'
	});

}

exports.quitSpaceAdmin = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Quit Space Admin
  router.put('/quit-space-admin', spaceController.quitSpaceAdmin);
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;
	data = req.body
	console.log(data.id);
	console.log(data.member_id);

	const updateQuitAdmin = await dbModels.Space.updateOne(
		{
			_id: ObjectId(data.id)
		},
		{
			$pull: { admins: ObjectId(data.member_id)}
		}
	)

	return res.status(200).send({
		message: 'quitSpaceAdmin'
	});
}

exports.addSpaceAdmin = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Get Space Admin
  router.put('/get-space-member', spaceController.getSpaceAdmin);
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;
	data = req.body
	console.log(data);
	console.log(data.id);

	const updateGetAdmin = await dbModels.Space.updateOne(
		{
			_id: ObjectId(data.id)
		},
		{
			$addToSet: { admins: ObjectId(data.member_id)}
		}
	)

	console.log(updateGetAdmin);

	return res.status(200).send({
		message: 'getSpaceAdmin'
	});
}



exports.searchSpaceMember = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : search space member 
  router.get('/searchSpaceMember', spaceController.searchSpaceMember);
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;
	data = req.query;
	console.log(data);
	
	try{
		const searchSpaceMember = await dbModels.Member.findOne(
			{	
				email: data.email
			},
		)

		return res.status(200).send({
			message: 'searchSpaceMember',
			searchSpaceMember
		});
	}
	catch{
		return res.status(500).send({
			message: 'searchSpaceMember Error'
		});
	}
}

exports.inviteSpaceMember = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Invite Space Member
  router.put('/inviteSpaceMember', spaceController.inviteSpaceMember);
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;
	data = req.body;
	console.log(data);

	
	try{
		const confirmMember = await dbModels.Space.find(
			{
				members: data.member_id,
				spaceTime: data.spaceTime
			}
		)
		// console.log(confirmMember);
		if(confirmMember.length != 0){
			return res.status(500).send({
				message: 'This member already participated.'
			})
		}
		const inviteSpaceMember = await dbModels.Space.findOneAndUpdate(
			{
				spaceTime: data.spaceTime
			},
			{
				$addToSet: { members: data.member_id }
			}
		)
		// console.log(inviteSpaceMember);
	
		const inviteMemberMenuside = await dbModels.MenuSide.updateOne(
			{
				member_id: data.member_id
			},
			{
				$addToSet: { space_list: inviteSpaceMember._id }
			}
		)
	
		const getDocId = await dbModels.Document.aggregate([
			{
				$match: {
					spaceTime_id: data.spaceTime
				}
			},
			{
				$project: {
					_id: 1,
				}
			}
		]);
	
		// console.log(getDocId.length);
		for (let index = 0; index < getDocId.length; index++) {
			const element = getDocId[index]._id;
			console.log(element)
			const enlistMeeting = await dbModels.Meeting.updateMany(
				{
					docId: element
				},
				{
					$addToSet: { enlistedMembers: data.member_id }
				}
			)
		}
	
		return res.status(200).send({
			message: 'inviteSpaceMember',
		});
	}
	catch (err) {
		console.log(err);
		return res.status(500).send({
			message: 'inviteSpaceMember Error'
		});
	}
}



///////////
// exports.getAllMember = async (req, res) => {

// 	console.log(`
// --------------------------------------------------
//   User : ${req.decoded._id}
//   API  : Get All Member
//   router.get('/getAllMember', spaceController.getAllMember);
// --------------------------------------------------`);

// 	const dbModels = global.DB_MODELS;

// 	const members = await dbModels.Member.aggregate([
// 		{
// 			$project: {
// 				_id: 1,
// 				name: 1,
// 				email: 1,
// 			}
// 		}
// 	]);
// 	console.log(members);

// 	try{
// 		return res.status(200).send({
// 			message: 'getAllMember',
// 			members
// 		});
// 	}
// 	catch{
// 		return res.status(500).send({
// 			message: 'DB Error'
// 		});
// 	}
// }