const PORT = 8000
const axios = require('axios')
const cheerio = require('cheerio')
const { response } = require('express')
const express = require('express')


const app = express()
// enter the URL that will serve as the base for the scraper
const url = 'https://deolhonoimposto.ibpt.org.br'

// This variable defines wich class will be the target for scrapper.
// In this example, the script collects the version and effective period of the new aliquot table presents in "destaque" HTML class.
const classNameHTML = 'destaque'

let texts_json = {}

// get the HTML code of 'url' and load in 'html'
axios(url)
  .then(response => {
      const html = response.data
      const $ = cheerio.load(html)
      let texts = []
      // gets each data in the target class and insert in a array
      $('.'+classNameHTML, html).each
      (
          function(){
            const title = $(this).text()
            texts.push(
              title
            )
          }
      )
      console.log("Scraper JSON Result", JSON.parse(JSON.stringify(Object.assign({}, texts))))
      texts_json = JSON.parse(JSON.stringify(Object.assign({}, texts)))
      // console.log(texts_json)
    }
  ).catch(err => console.log(err))
 


  app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))
  console.log(texts_json)

