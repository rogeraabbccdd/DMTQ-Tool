/* global __statics */

import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { parse } from 'fast-csv'
import { once } from 'events'
import md5File from 'md5-file'

const filesBoth = [
  'product_item.csv',
  'product_product.csv',
  'song_song.csv',
  'song_songPattern.csv'
]
const fileLang = ['item_desc', 'song_desc']
const langs = ['cn', 'jp', 'kr', 'tw', 'us']

export default {
  init () {
    ipcMain.on('initPath', (event, arg) => {
      let reply = false

      // is csv exists
      const filePathCSV = path.resolve(arg, 'ios/table/kr/song_song.csv')
      const existCSV = fs.existsSync(filePathCSV)
      // is lz4 exists
      const filePathLZ4 = path.resolve(arg, 'ios/table/kr/song_song.csv.lz4')
      const existLZ4 = fs.existsSync(filePathLZ4)

      if (existCSV) {
        // csv exists
        reply = true
      } else if (existLZ4) {
        try {
          // lz4 exists, csv not exists, copy file from app
          for (const file of filesBoth) {
            for (const lang of langs) {
              const destIOS = path.resolve(arg, `ios/table/${lang}/${file}`)
              fs.unlinkSync(destIOS + '.lz4')
              fs.copyFileSync(path.resolve(__statics, `table/both/${file}`), destIOS)
              const destAndroid = path.resolve(arg, `android/table/${lang}/${file}`)
              fs.unlinkSync(destAndroid + '.lz4')
              fs.copyFileSync(path.resolve(__statics, `table/both/${file}`), destAndroid)
            }
          }
          for (const file of fileLang) {
            for (const lang of langs) {
              const destIOS = path.resolve(arg, `ios/table/${lang}/${file}_${lang}.csv`)
              fs.unlinkSync(destIOS + '.lz4')
              fs.copyFileSync(path.resolve(__statics, `table/bothlang/${lang}/${file}_${lang}.csv`), destIOS)
              const destAndroid = path.resolve(arg, `android/table/${lang}/${file}_${lang}.csv`)
              fs.unlinkSync(destAndroid + '.lz4')
              fs.copyFileSync(path.resolve(__statics, `table/bothlang/${lang}/${file}_${lang}.csv`), destAndroid)
            }
          }
          for (const lang of langs) {
            let dest = path.resolve(arg, `ios/table/${lang}/category_categoryproduct.csv`)
            fs.unlinkSync(dest + '.lz4')
            fs.copyFileSync(path.resolve(__statics, 'table/ios/category_categoryproduct.csv'), dest)
            dest = path.resolve(arg, `android/table/${lang}/category_categoryproduct.csv`)
            fs.unlinkSync(dest + '.lz4')
            fs.copyFileSync(path.resolve(__statics, 'table/android/category_categoryproduct.csv'), dest)
          }
          let dest = path.resolve(arg, 'ios/patch_new.csv')
          fs.unlinkSync(dest + '.lz4')
          fs.copyFileSync(path.resolve(__statics, 'table/ios/patch_new.csv'), dest)
          dest = path.resolve(arg, 'android/patch_new.csv')
          fs.unlinkSync(dest + '.lz4')
          fs.copyFileSync(path.resolve(__statics, 'table/android/patch_new.csv'), dest)
        } catch (error) {
          console.log(error)
        }
        reply = true
      }

      event.reply('initPath-reply', { result: reply })
    })

    ipcMain.on('readData', async (event, arg) => {
      const songs = []
      const patterns = []
      const songStream = fs.createReadStream(path.resolve(arg, 'ios/table/kr/song_song.csv'), 'utf8')
        .pipe(parse({ delimiter: ',', headers: true }))
        .on('data', (data) => {
          songs.push(data)
        })
      await once(songStream, 'finish')
      const patternStream = fs.createReadStream(path.resolve(arg, 'ios/table/kr/song_songPattern.csv'), 'utf8')
        .pipe(parse({ delimiter: ',', headers: true }))
        .on('data', (data) => {
          patterns.push(data)
        })
      await once(patternStream, 'finish')

      event.reply('readData-reply', { songs, patterns })
    })

    ipcMain.on('saveSong', async (event, arg) => {
      const songs = arg.songs
      for (const i in songs) {
        for (const j in songs[i]) {
          if (songs[i][j].toString().includes(',')) songs[i][j] = `"${songs[i][j]}"`
        }
      }
      const filePath = arg.path
      const hashs = []
      for (const lang of langs) {
        // **** update ios song_song.csv ****
        let destPath = path.join(filePath, `ios/table/${lang}/song_song.csv`)
        let destPath2 = `ios/table/${lang}/song_song.csv`
        let writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('song_id,item_id,name,full_name,genre,artist_name,original_bga_yn,loop_bga_yn,composed_by,singer,feat_by,arranged_by,visualized_by,cost_game_point,cost_game_cash,flag,status,free_yn,hidden_yn,open_yn,track_id,mod_date,update\r\n')
        for await (const song of songs) {
          writeStream.write(`${song.song_id},${song.item_id},${song.name},${song.full_name},${song.genre},${song.artist_name},${song.original_bga_yn},${song.loop_bga_yn},${song.composed_by},${song.singer},${song.feat_by},${song.arranged_by},${song.visualized_by},${song.cost_game_point},${song.cost_game_cash},${song.flag},${song.status},${song.free_yn},${song.hidden_yn},${song.open_yn},${song.track_id},${song.mod_date},${song.update}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        let hash = md5File.sync(destPath)
        let fileSize = fs.statSync(destPath).size
        hashs.push({ file: destPath2, hash, size: fileSize })
    
        // **** update android song_song.csv ****
        destPath = path.join(filePath, `android/table/${lang}/song_song.csv`)
        destPath2 = `android/table/${lang}/song_song.csv`
        writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('song_id,item_id,name,full_name,genre,artist_name,original_bga_yn,loop_bga_yn,composed_by,singer,feat_by,arranged_by,visualized_by,cost_game_point,cost_game_cash,flag,status,free_yn,hidden_yn,open_yn,track_id,mod_date,update\r\n')
        for await (const song of songs) {
          writeStream.write(`${song.song_id},${song.item_id},${song.name},${song.full_name},${song.genre},${song.artist_name},${song.original_bga_yn},${song.loop_bga_yn},${song.composed_by},${song.singer},${song.feat_by},${song.arranged_by},${song.visualized_by},${song.cost_game_point},${song.cost_game_cash},${song.flag},${song.status},${song.free_yn},${song.hidden_yn},${song.open_yn},${song.track_id},${song.mod_date},${song.update}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        hash = md5File.sync(destPath)
        fileSize = fs.statSync(destPath).size
        hashs.push({ file: destPath2, hash, size: fileSize })
    
        // **** update ios category_categoryproduct.csv ****
        let categoryproducts = []
        // read csv
        destPath = path.join(filePath, `ios/table/${lang}/category_categoryproduct.csv`)
        destPath2 = `ios/table/${lang}/category_categoryproduct.csv`
        let readStream = fs.createReadStream(destPath, 'utf8')
          .pipe(parse({ delimiter: ',', headers: true }))
          .on('data', (data) => {
            categoryproducts.push(data)
          })
        await once(readStream, 'finish')
        // delete songs id > 191
        categoryproducts = categoryproducts.filter(categoryproduct => !(parseInt(categoryproduct.category_id) === 3 && parseInt(categoryproduct.product_id) > 191))
        // add new songs
        for (const song of songs) {
          if (song.song_id > 191) {
            categoryproducts.push({
              category_id: 3,
              product_id: song.song_id,
              display_order: 0,
              update: 1
            })
          }
        }
        // sort by category id
        categoryproducts = categoryproducts.sort((a, b) => a.category_id - b.category_id)
        for (const i in categoryproducts) {
          for (const j in categoryproducts[i]) {
            if (categoryproducts[i][j].toString().includes(',')) categoryproducts[i][j] = `"${categoryproducts[i][j]}"`
          }
        }
        // write
        writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('category_id,product_id,display_order,update\r\n')
        for await (const categoryproduct of categoryproducts) {
          writeStream.write(`${categoryproduct.category_id},${categoryproduct.product_id},${categoryproduct.display_order},${categoryproduct.update}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        hash = md5File.sync(destPath)
        fileSize = fs.statSync(destPath).size
        hashs.push({ file: destPath2, hash, size: fileSize })
    
        // **** update android category_categoryproduct.csv ****
        categoryproducts = []
        destPath = path.join(filePath, `android/table/${lang}/category_categoryproduct.csv`)
        destPath2 = `android/table/${lang}/category_categoryproduct.csv`
        readStream = fs.createReadStream(destPath, 'utf8')
          .pipe(parse({ delimiter: ',', headers: true }))
          .on('data', (data) => {
            categoryproducts.push(data)
          })
        await once(readStream, 'finish')
        // delete songs id > 191
        categoryproducts = categoryproducts.filter(categoryproduct => !(parseInt(categoryproduct.category_id) === 3 && parseInt(categoryproduct.product_id) > 191))
        // add new songs
        for (const song of songs) {
          if (song.song_id > 191) {
            categoryproducts.push({
              category_id: 3,
              product_id: song.song_id,
              display_order: 0,
              update: 1
            })
          }
        }
        // sort by category id
        categoryproducts = categoryproducts.sort((a, b) => a.category_id - b.category_id)
        for (const i in categoryproducts) {
          for (const j in categoryproducts[i]) {
            if (categoryproducts[i][j].toString().includes(',')) categoryproducts[i][j] = `"${categoryproducts[i][j]}"`
          }
        }
        // write
        writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('category_id,product_id,display_order,update\r\n')
        for await (const categoryproduct of categoryproducts) {
          writeStream.write(`${categoryproduct.category_id},${categoryproduct.product_id},${categoryproduct.display_order},${categoryproduct.update}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        hash = md5File.sync(destPath)
        fileSize = fs.statSync(destPath).size
        hashs.push({ file: destPath2, hash, size: fileSize })
    
        // **** update ios product_item.csv ****
        // read csv
        let productItems = []
        destPath = path.join(filePath, `ios/table/${lang}/product_item.csv`)
        destPath2 = `ios/table/${lang}/product_item.csv`
        readStream = fs.createReadStream(destPath, 'utf8')
          .pipe(parse({ delimiter: ',', headers: true }))
          .on('data', (data) => {
            productItems.push(data)
          })
        await once(readStream, 'finish')
        // delete songs id > 191
        productItems = productItems.filter(productItem => !(parseInt(productItem.item_id) > 191 && parseInt(productItem.item_id) < 10001))
        // add new songs
        for (const song of songs) {
          if (song.song_id > 191) {
            productItems.push({
              item_id: song.song_id,
              item_name: song.name,
              img_url_1: '',
              img_url_2: '',
              description: '',
              repeat_count: 0,
              item_type: 'S',
              limit_minute: 0,
              status: 'N',
              buy_level: 0,
              buy_limit_count: 1,
              buy_limit_type: 'F',
              summary: '12월20일업데이트',
              update: 1
            })
          }
        }
        // sort by category id
        productItems = productItems.sort((a, b) => a.item_id - b.item_id)
        for (const i in productItems) {
          for (const j in productItems[i]) {
            if (productItems[i][j].toString().includes(',')) productItems[i][j] = `"${productItems[i][j]}"`
          }
        }
        // write
        writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('item_id,item_name,img_url_1,img_url_2,description,repeat_count,item_type,limit_minute,status,buy_level,buy_limit_count,buy_limit_type,summary,update\r\n')
        for await (const productItem of productItems) {
          writeStream.write(`${productItem.item_id},${productItem.item_name},${productItem.img_url_1},${productItem.img_url_2},${productItem.description},${productItem.repeat_count},${productItem.item_type},${productItem.limit_minute},${productItem.status},${productItem.buy_level},${productItem.buy_limit_count},${productItem.buy_limit_type},${productItem.summary},${productItem.update}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        hash = md5File.sync(destPath)
        fileSize = fs.statSync(destPath).size
        hashs.push({ file: destPath2, hash, size: fileSize })
    
        // **** update android product_item.csv ****
        // read csv
        productItems = []
        destPath = path.join(filePath, `android/table/${lang}/product_item.csv`)
        destPath2 = `android/table/${lang}/product_item.csv`
        readStream = fs.createReadStream(destPath, 'utf8')
          .pipe(parse({ delimiter: ',', headers: true }))
          .on('data', (data) => {
            productItems.push(data)
          })
        await once(readStream, 'finish')
        // delete songs id > 191
        productItems = productItems.filter(productItem => !(parseInt(productItem.item_id) > 191 && parseInt(productItem.item_id) < 10001))
        // add new songs
        for (const song of songs) {
          if (song.song_id > 191) {
            productItems.push({
              item_id: song.song_id,
              item_name: song.name,
              img_url_1: '',
              img_url_2: '',
              description: '',
              repeat_count: 0,
              item_type: 'S',
              limit_minute: 0,
              status: 'N',
              buy_level: 0,
              buy_limit_count: 1,
              buy_limit_type: 'F',
              summary: '12월20일업데이트',
              update: 1
            })
          }
        }
        // sort by id
        productItems = productItems.sort((a, b) => a.item_id - b.item_id)
        for (const i in productItems) {
          for (const j in productItems[i]) {
            if (productItems[i][j].toString().includes(',')) productItems[i][j] = `"${productItems[i][j]}"`
          }
        }
        // write
        writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('item_id,item_name,img_url_1,img_url_2,description,repeat_count,item_type,limit_minute,status,buy_level,buy_limit_count,buy_limit_type,summary,update\r\n')
        for await (const productItem of productItems) {
          writeStream.write(`${productItem.item_id},${productItem.item_name},${productItem.img_url_1},${productItem.img_url_2},${productItem.description},${productItem.repeat_count},${productItem.item_type},${productItem.limit_minute},${productItem.status},${productItem.buy_level},${productItem.buy_limit_count},${productItem.buy_limit_type},${productItem.summary},${productItem.update}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        hash = md5File.sync(destPath)
        fileSize = fs.statSync(destPath).size
        hashs.push({ file: destPath2, hash, size: fileSize })
    
        // **** update ios product_product.csv ****
        // read csv
        let productProducts = []
        destPath = path.join(filePath, `ios/table/${lang}/product_product.csv`)
        destPath2 = `ios/table/${lang}/product_product.csv`
        readStream = fs.createReadStream(destPath, 'utf8')
          .pipe(parse({ delimiter: ',', headers: true }))
          .on('data', (data) => {
            productProducts.push(data)
          })
        await once(readStream, 'finish')
        // delete songs id > 191
        productProducts = productProducts.filter(productProduct => 
          !((parseInt(productProduct.product_id) > 191 && parseInt(productProduct.product_id) < 10001) || (parseInt(productProduct.product_id) > 1000191 && parseInt(productProduct.product_id) < 1010001))
        )
        
        // add new songs
        let platformProductID = 20000
        for (const song of songs) {
          if (song.song_id > 191) {
            productProducts.push({
              product_id: song.song_id,
              item_id: song.song_id,
              platform_product_id: platformProductID,
              store_product_id: 'com.neowizInternet.game.dmtq.' + song.name,
              product_type: 'I',
              cost_game_point: 0,
              cost_game_cash: 20,
              status: 'F',
              sale_start_date: '',
              sale_end_date: '',
              update: 1
            })
            platformProductID++
            productProducts.push({
              product_id: '1000'+song.song_id,
              item_id: song.song_id,
              platform_product_id: platformProductID,
              store_product_id: 'com.neowizInternet.game.dmtq.' + song.name,
              product_type: 'I',
              cost_game_point: 0,
              cost_game_cash: 20,
              status: 'F',
              sale_start_date: '',
              sale_end_date: '',
              update: 1
            })
            platformProductID++
          }
        }
        // sort by id
        productProducts = productProducts.sort((a, b) => a.product_id - b.product_id)
        for (const i in productProducts) {
          for (const j in productProducts[i]) {
            if (productProducts[i][j].toString().includes(',')) productProducts[i][j] = `"${productProducts[i][j]}"`
          }
        }
        // write csv
        writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('product_id,item_id,platform_product_id,store_product_id,product_type,cost_game_point,cost_game_cash,status,sale_start_date,sale_end_date,update\r\n')
        for await (const productProduct of productProducts) {
          writeStream.write(`${productProduct.product_id},${productProduct.item_id},${productProduct.platform_product_id},${productProduct.store_product_id},${productProduct.product_type},${productProduct.cost_game_point},${productProduct.cost_game_cash},${productProduct.status},${productProduct.sale_start_date},${productProduct.sale_end_date},${productProduct.update}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        hash = md5File.sync(destPath)
        fileSize = fs.statSync(destPath).size
        hashs.push({ file: destPath2, hash, size: fileSize })
    
        // **** update android product_product.csv ****
        productProducts = []
        destPath = path.join(filePath, `android/table/${lang}/product_product.csv`)
        destPath2 = `android/table/${lang}/product_product.csv`
        readStream = fs.createReadStream(destPath, 'utf8')
          .pipe(parse({ delimiter: ',', headers: true }))
          .on('data', (data) => {
            productProducts.push(data)
          })
        await once(readStream, 'finish')
        // delete songs id > 191
        productProducts = productProducts.filter(productProduct => 
          !((parseInt(productProduct.product_id) > 191 && parseInt(productProduct.product_id) < 10001) || (parseInt(productProduct.product_id) > 1000191 && parseInt(productProduct.product_id) < 1010001))
        )

        // add new songs
        platformProductID = 20000
        for (const song of songs) {
          if (song.song_id > 191) {
            productProducts.push({
              product_id: song.song_id,
              item_id: song.song_id,
              platform_product_id: platformProductID,
              store_product_id: 'com.neowizInternet.game.dmtq.' + song.name,
              product_type: 'I',
              cost_game_point: 0,
              cost_game_cash: 20,
              status: 'F',
              sale_start_date: '',
              sale_end_date: '',
              update: 1
            })
            platformProductID++
            productProducts.push({
              product_id: '1000'+song.song_id,
              item_id: song.song_id,
              platform_product_id: platformProductID,
              store_product_id: 'com.neowizInternet.game.dmtq.' + song.name,
              product_type: 'I',
              cost_game_point: 0,
              cost_game_cash: 20,
              status: 'F',
              sale_start_date: '',
              sale_end_date: '',
              update: 1
            })
            platformProductID++
          }
        }
        // sort by id
        productProducts = productProducts.sort((a, b) => a.product_id - b.product_id)
        for (const i in productProducts) {
          for (const j in productProducts[i]) {
            if (productProducts[i][j].toString().includes(',')) productProducts[i][j] = `"${productProducts[i][j]}"`
          }
        }
        // write csv
        writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('product_id,item_id,platform_product_id,store_product_id,product_type,cost_game_point,cost_game_cash,status,sale_start_date,sale_end_date,update\r\n')
        for await (const productProduct of productProducts) {
          writeStream.write(`${productProduct.product_id},${productProduct.item_id},${productProduct.platform_product_id},${productProduct.store_product_id},${productProduct.product_type},${productProduct.cost_game_point},${productProduct.cost_game_cash},${productProduct.status},${productProduct.sale_start_date},${productProduct.sale_end_date},${productProduct.update}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        hash = md5File.sync(destPath)
        fileSize = fs.statSync(destPath).size
        hashs.push({ file: destPath2, hash, size: fileSize })
    
        // **** update ios item_desc.csv ****
        let itemDescs = []
        destPath = path.join(filePath, `ios/table/${lang}/item_desc_${lang}.csv`)
        destPath2 = `ios/table/${lang}/item_desc_${lang}.csv`
        readStream = fs.createReadStream(destPath, 'utf8')
          .pipe(parse({ delimiter: ',', headers: true }))
          .on('data', (data) => {
            itemDescs.push(data)
          })
        await once(readStream, 'finish')
        // delete songs id > 191
        itemDescs = itemDescs.filter(itemDesc => !(parseInt(itemDesc.item_id) > 191 && parseInt(itemDesc.item_id) < 10001))
        // add new songs
        for (const song of songs) {
          if (song.song_id > 191) {
            itemDescs.push({
              item_id: song.song_id,
              name: song.full_name,
              description: `Genre : ${song.genre}\\nArtist : ${song.artist_name}`,
              summary: ''
            })
          }
        }
        // sort by id
        itemDescs = itemDescs.sort((a, b) => a.item_id - b.item_id)
        for (const i in itemDescs) {
          for (const j in itemDescs[i]) {
            if (itemDescs[i][j].toString().includes(',')) itemDescs[i][j] = `"${itemDescs[i][j]}"`
          }
        }
        // write csv
        writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('item_id,name,description,summary\r\n')
        for await (const itemDesc of itemDescs) {
          writeStream.write(`${itemDesc.item_id},${itemDesc.name},${itemDesc.description},${itemDesc.summary}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        hash = md5File.sync(destPath)
        fileSize = fs.statSync(destPath).size
        hashs.push({ file: destPath2, hash, size: fileSize })
    
        // **** update android item_desc.csv ****
        itemDescs = []
        destPath = path.join(filePath, `android/table/${lang}/item_desc_${lang}.csv`)
        destPath2 = `android/table/${lang}/item_desc_${lang}.csv`
        readStream = fs.createReadStream(destPath, 'utf8')
          .pipe(parse({ delimiter: ',', headers: true }))
          .on('data', (data) => {
            itemDescs.push(data)
          })
        await once(readStream, 'finish')
        // delete songs id > 191
        itemDescs = itemDescs.filter(itemDesc => !(parseInt(itemDesc.item_id) > 191 && parseInt(itemDesc.item_id) < 10001))
        // add new songs
        for (const song of songs) {
          if (song.song_id > 191) {
            itemDescs.push({
              item_id: song.song_id,
              name: song.full_name,
              description: `Genre : ${song.genre}\\nArtist : ${song.artist_name}`,
              summary: ''
            })
          }
        }
        // sort by id
        itemDescs = itemDescs.sort((a, b) => a.item_id - b.item_id)
        for (const i in itemDescs) {
          for (const j in itemDescs[i]) {
            if (itemDescs[i][j].toString().includes(',')) itemDescs[i][j] = `"${itemDescs[i][j]}"`
          }
        }
        // write csv
        writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('item_id,name,description,summary\r\n')
        for await (const itemDesc of itemDescs) {
          writeStream.write(`${itemDesc.item_id},${itemDesc.name},${itemDesc.description},${itemDesc.summary}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        hash = md5File.sync(destPath)
        fileSize = fs.statSync(destPath).size
        hashs.push({ file: destPath2, hash, size: fileSize })
    
        // **** update ios song_desc.csv ****
        let songDescs = []
        destPath = path.join(filePath, `ios/table/${lang}/song_desc_${lang}.csv`)
        destPath2 = `ios/table/${lang}/song_desc_${lang}.csv`
        readStream = fs.createReadStream(destPath, 'utf8')
          .pipe(parse({ delimiter: ',', headers: true }))
          .on('data', (data) => {
            songDescs.push(data)
          })
        await once(readStream, 'finish')
        // delete songs id > 191
        songDescs = songDescs.filter(songDesc => parseInt(songDesc.song_id) <= 191)
        // add new songs
        for (const song of songs) {
          if (song.song_id > 191) {
            songDescs.push({
              song_id: song.song_id,
              fullname: song.full_name,
              genre: song.genre,
              artist: song.artist_name,
              composed_by: song.composed_by,
              singer: song.singer,
              feat_by: song.feat_by,
              arranged_by: song.arranged_by,
              visualized_by: song.visualized_by
            })
          }
        }
        // sort by id
        songDescs = songDescs.sort((a, b) => a.song_id - b.song_id)
        for (const i in songDescs) {
          for (const j in songDescs[i]) {
            if (songDescs[i][j].toString().includes(',')) songDescs[i][j] = `"${songDescs[i][j]}"`
          }
        }
        // write csv
        writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('song_id,fullname,genre,artist,composed_by,singer,feat_by,arranged_by,visualized_by\r\n')
        for await (const songDesc of songDescs) {
          writeStream.write(`${songDesc.song_id},${songDesc.fullname},${songDesc.genre},${songDesc.artist},${songDesc.composed_by},${songDesc.singer},${songDesc.feat_by},${songDesc.arranged_by},${songDesc.visualized_by}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        hash = md5File.sync(destPath)
        fileSize = fs.statSync(destPath).size
        hashs.push({ file: destPath2, hash, size: fileSize })
    
        // **** update android song_desc.csv ****
        songDescs = []
        destPath = path.join(filePath, `android/table/${lang}/song_desc_${lang}.csv`)
        destPath2 = `android/table/${lang}/song_desc_${lang}.csv`
        readStream = fs.createReadStream(destPath, 'utf8')
          .pipe(parse({ delimiter: ',', headers: true }))
          .on('data', (data) => {
            songDescs.push(data)
          })
        await once(readStream, 'finish')
        // delete songs id > 191
        songDescs = songDescs.filter(songDesc => parseInt(songDesc.song_id) <= 191)
        // add new songs
        for (const song of songs) {
          if (song.song_id > 191) {
            songDescs.push({
              song_id: song.song_id,
              fullname: song.full_name,
              genre: song.genre,
              artist: song.artist_name,
              composed_by: song.composed_by,
              singer: song.singer,
              feat_by: song.feat_by,
              arranged_by: song.arranged_by,
              visualized_by: song.visualized_by
            })
          }
        }
        // sort by id
        songDescs = songDescs.sort((a, b) => a.song_id - b.song_id)
        for (const i in songDescs) {
          for (const j in songDescs[i]) {
            if (songDescs[i][j].toString().includes(',')) songDescs[i][j] = `"${songDescs[i][j]}"`
          }
        }
        // write csv
        writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('song_id,fullname,genre,artist,composed_by,singer,feat_by,arranged_by,visualized_by\r\n')
        for await (const songDesc of songDescs) {
          writeStream.write(`${songDesc.song_id},${songDesc.fullname},${songDesc.genre},${songDesc.artist},${songDesc.composed_by},${songDesc.singer},${songDesc.feat_by},${songDesc.arranged_by},${songDesc.visualized_by}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        hash = md5File.sync(destPath)
        fileSize = fs.statSync(destPath).size
        hashs.push({ file: destPath2, hash, size: fileSize })
      }
      // **** ios update patch.csv ****
      let patches = []
      let destPath = path.join(filePath, 'ios/patch_new.csv')
      let readStream = fs.createReadStream(destPath, 'utf8')
        .pipe(parse({ delimiter: ',', headers: true }))
        .on('data', (data) => {
          patches.push(data)
        })
      await once(readStream, 'finish')
      for (const i in patches) {
        for (const hash of hashs) {
          if (('ios/' + patches[i].file_name).includes(hash.file)) {
            patches[i].checksum = hash.hash
            patches[i].file_size = hash.size
          }
        }
      }
      let writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
      writeStream.write('file_name,file_size,checksum,compressed_file_size,compressed_checksum,acquire_on_demand,compressed,platform,tag,\r\n')
      for await (const patch of patches) {
        writeStream.write(`${patch.file_name},${patch.file_size},${patch.checksum},${patch.compressed_file_size},${patch.compressed_checksum},${patch.acquire_on_demand},${patch.compressed},${patch.platform},${patch.tag},\r\n`)
      }
      writeStream.end()
      await once(writeStream, 'finish')
    
      // **** android update patch.csv ****
      patches = []
      destPath = path.join(filePath, 'android/patch_new.csv')
      readStream = fs.createReadStream(destPath, 'utf8')
        .pipe(parse({ delimiter: ',', headers: true }))
        .on('data', (data) => {
          patches.push(data)
        })
      await once(readStream, 'finish')
      for (const i in patches) {
        for (const hash of hashs) {
          if (('android/' + patches[i].file_name).includes(hash.file)) {
            patches[i].checksum = hash.hash
            patches[i].file_size = hash.size
          }
        }
      }
      writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
      writeStream.write('file_name,file_size,checksum,compressed_file_size,compressed_checksum,acquire_on_demand,compressed,platform,tag,\r\n')
      for await (const patch of patches) {
        writeStream.write(`${patch.file_name},${patch.file_size},${patch.checksum},${patch.compressed_file_size},${patch.compressed_checksum},${patch.acquire_on_demand},${patch.compressed},${patch.platform},${patch.tag},\r\n`)
      }
      writeStream.end()
      await once(writeStream, 'finish')
    
      event.reply('saveSong-reply')
    })

    ipcMain.on('savePattern', async (event, arg) => {
      const filePath = arg.path
      const patterns = arg.patterns
      let hashAndroid = {}
      let hashiOS = {}
      for (const lang of langs) {
        // **** update ios song_songPattern.csv ****
        let destPath = path.join(filePath, `ios/table/${lang}/song_songPattern.csv`)
        let writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('pattern_id,song_id,signature,line,difficulty,point_type,point_value,flg,update\r\n')
        for await (const pattern of patterns) {
          writeStream.write(`${pattern.pattern_id},${pattern.song_id},${pattern.signature},${pattern.line},${pattern.difficulty},${pattern.point_type},${pattern.point_value},${pattern.flg},${pattern.update}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        let hash = md5File.sync(destPath)
        let fileSize = fs.statSync(destPath).size
        hashiOS = {hash, size: fileSize }

        // **** update android song_songPattern.csv ****
        destPath = path.join(filePath, `android/table/${lang}/song_songPattern.csv`)
        writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
        writeStream.write('pattern_id,song_id,signature,line,difficulty,point_type,point_value,flg,update\r\n')
        for await (const pattern of patterns) {
          writeStream.write(`${pattern.pattern_id},${pattern.song_id},${pattern.signature},${pattern.line},${pattern.difficulty},${pattern.point_type},${pattern.point_value},${pattern.flg},${pattern.update}\r\n`)
        }
        writeStream.end()
        await once(writeStream, 'finish')
        hash = md5File.sync(destPath)
        fileSize = fs.statSync(destPath).size
        hashAndroid = {hash, size: fileSize }
      }

      // **** ios update patch.csv ****
      const patches = []
      let destPath = path.join(filePath, 'ios/patch_new.csv')
      let readStream = fs.createReadStream(destPath, 'utf8')
        .pipe(parse({ delimiter: ',', headers: true }))
        .on('data', (data) => {
          patches.push(data)
        })
      await once(readStream, 'finish')
      for (const i in patches) {
        if (patches[i].file_name.includes('song_songPattern')) {
          patches[i].checksum = hashiOS.hash
          patches[i].file_size = hashiOS.size
        }
      }
      let writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
      writeStream.write('file_name,file_size,checksum,compressed_file_size,compressed_checksum,acquire_on_demand,compressed,platform,tag,\r\n')
      for await (const patch of patches) {
        writeStream.write(`${patch.file_name},${patch.file_size},${patch.checksum},${patch.compressed_file_size},${patch.compressed_checksum},${patch.acquire_on_demand},${patch.compressed},${patch.platform},${patch.tag},\r\n`)
      }
      writeStream.end()
      await once(writeStream, 'finish')

      // **** android update patch.csv ****
      patches.splice(0, patches.length)
      destPath = path.join(filePath, 'android/patch_new.csv')
      readStream = fs.createReadStream(destPath, 'utf8')
        .pipe(parse({ delimiter: ',', headers: true }))
        .on('data', (data) => {
          patches.push(data)
        })
      await once(readStream, 'finish')
      for (const i in patches) {
        if (patches[i].file_name.includes('song_songPattern')) {
          patches[i].checksum = hashAndroid.hash
          patches[i].file_size = hashAndroid.size
        }
      }
      writeStream = fs.createWriteStream(destPath, { flag: 'w', mode: 0o777 })
      writeStream.write('file_name,file_size,checksum,compressed_file_size,compressed_checksum,acquire_on_demand,compressed,platform,tag,\r\n')
      for await (const patch of patches) {
        writeStream.write(`${patch.file_name},${patch.file_size},${patch.checksum},${patch.compressed_file_size},${patch.compressed_checksum},${patch.acquire_on_demand},${patch.compressed},${patch.platform},${patch.tag},\r\n`)
      }
      writeStream.end()
      await once(writeStream, 'finish')

      event.reply('savePattern-reply')
    })
  }
}
