import * as Joi from '@hapi/joi'
const fs = require('fs');
import path from 'path'


// This is the JOI validation schema, you define
// all the validation logic in here, then run
// the validation during the request lifecycle.
// If you prefer to use your own way of validating the 
// incoming data, you can use it.
const schema = Joi.object<import('../../types').Matrix>({

})


//called to create/update validated pricing data in json file in public folder
const saveData = async (data) => {
  console.log(data);

  try {

    const dir = path.resolve('./', './public/pricing.json');


    await fs.writeFile(dir, JSON.stringify(data), function (err) {
      if (err) throw err;
      return true;
    });
  } catch (e) {

  }



}

export default async (req: import('next').NextApiRequest, res: import('next').NextApiResponse) => {
  var data = req.body;
  try {
    // This will throw when the validation fails
    // const data = await schema.validateAsync(req.body, {
    //  abortEarly: false
    //}) as import('../../types').Matrix

    // Write the new matrix to public/pricing.json
    await saveData(data);

    res.statusCode = 200
    res.json(data)
  } catch (e) {
    console.error(e)
    if (e.isJoi) {
      // Handle the validation error and return a proper response
      res.statusCode = 422
      res.end('Error')
      return
    }

    res.statusCode = 500
    res.json({ error: 'Unknown Error' })
  }
}