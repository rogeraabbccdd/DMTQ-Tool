<template lang="pug">
  q-page#index
    section.q-mx-auto.padding
      .container
        .row
          .col-12.q-mx-auto
            h4.text-center.text-white DMTQ Tool v{{ version }}
          .col-12.q-mx-auto
            q-tabs(v-model="tab")
              q-tab(name="songs" icon="album" label="Songs")
              q-tab(name="patterns" icon="music_note" label="Patterns")
              q-tab(name="settings" icon="settings" label="Settings")
            q-tab-panels(v-model="tab" animated)
              q-tab-panel(name="songs")
                .text-h6.text-center Custom Songs
                hr
                div(v-if="settings.path.length === 0")
                  p.text-center Please set your server path at settings page first.
                div(v-else)
                  p.text-center
                    | Click column to edit songs.
                    br
                    | Press enter to confirm edit.
                    br
                    | Don't forget to click save button after you edit.
                  q-table(:data="customSongs" :columns="songColumns")
                    template(v-slot:top)
                      q-btn(color="primary" label="Add song" @click="newSongDialog = true")
                    template(v-slot:body="props")
                      q-tr(:props="props")
                        q-td(key="song_id" :props="props")
                          | {{ props.row.song_id }}
                        q-td(key="name" :props="props")
                          | {{ props.row.name }}
                          q-popup-edit(v-model="props.row.name")
                            q-input(v-model="props.row.name" dense autofocus)
                        q-td(key="full_name" :props="props")
                          | {{ props.row.full_name }}
                          q-popup-edit(v-model="props.row.full_name")
                            q-input(v-model="props.row.full_name" dense autofocus)
                        q-td(key="genre" :props="props")
                          | {{ props.row.genre }}
                          q-popup-edit(v-model="props.row.genre")
                            q-input(v-model="props.row.genre" dense autofocus)
                        q-td(key="artist_name" :props="props")
                          | {{ props.row.artist_name }}
                          q-popup-edit(v-model="props.row.artist_name")
                            q-input(v-model="props.row.artist_name" dense autofocus)
                        q-td(key="loop_bga_yn" :props="props")
                          | {{ props.row.loop_bga_yn ? 'Y' : 'N' }}
                          q-popup-edit(v-model="props.row.loop_bga_yn")
                            q-toggle(v-model="props.row.loop_bga_yn" color="primary")
                        q-td(key="composed_by" :props="props")
                          | {{ props.row.composed_by }}
                          q-popup-edit(v-model="props.row.composed_by")
                            q-input(v-model="props.row.composed_by" dense autofocus)
                        q-td(key="singer" :props="props")
                          | {{ props.row.singer }}
                          q-popup-edit(v-model="props.row.singer")
                            q-input(v-model="props.row.singer" dense autofocus)
                        q-td(key="feat_by" :props="props")
                          | {{ props.row.feat_by }}
                          q-popup-edit(v-model="props.row.feat_by")
                            q-input(v-model="props.row.feat_by" dense autofocus)
                        q-td(key="arranged_by" :props="props")
                          | {{ props.row.arranged_by }}
                          q-popup-edit(v-model="props.row.arranged_by")
                            q-input(v-model="props.row.arranged_by" dense autofocus)
                        q-td(key="visualized_by" :props="props")
                          | {{ props.row.visualized_by }}
                          q-popup-edit(v-model="props.row.visualized_by")
                            q-input(v-model="props.row.visualized_by" dense autofocus)
                  br
                  q-btn(color="green" label="Save" @click="saveSong" :loading="saving")
              q-tab-panel(name="patterns")
                .text-h6.text-center Custom Patterns
                hr
                div(v-if="settings.path.length === 0")
                  p.text-center Please set your server path at settings page first.
                div(v-else)
                  p.text-center
                    | Click column to edit songs.
                    br
                    | Press enter to confirm edit.
                    br
                    | Don't forget to click save button after you edit.
                  q-table(:data="customPatterns" :columns="patternColumns" :rows-per-page-options="[20, 50, 100, 0]")
                    template(v-slot:top)
                      q-btn(color="primary" label="Add Pattern" @click="newPatternDialog = true")
                    template(v-slot:body="props")
                      q-tr(:props="props")
                        q-td(key="pattern_id" :props="props")
                          | {{ props.row.pattern_id }}
                        q-td(key="song_id" :props="props")
                          | {{ getSongName(props.row.song_id) }}
                          q-popup-edit(v-model="props.row.song_id")
                            q-select(v-model="props.row.song_id" :options="songOptions" dense emit-value map-options autofocus)
                        q-td(key="signature" :props="props")
                          | {{ props.row.signature }}
                          q-popup-edit(v-model="props.row.signature")
                            q-input(v-model="props.row.signature" type="number" dense autofocus)
                        q-td(key="line" :props="props")
                          | {{ props.row.line }}
                          q-popup-edit(v-model="props.row.line")
                            q-input(v-model="props.row.line" type="number" dense autofocus)
                        q-td(key="difficulty" :props="props")
                          | {{ props.row.difficulty }}
                          q-popup-edit(v-model="props.row.difficulty")
                            q-input(v-model="props.row.difficulty" type="number" dense autofocus)
                  br
                  q-btn(color="green" label="Save" @click="savePattern" :loading="saving")
              q-tab-panel(name="settings")
                p.q-mb-none Game Server Path (patch/phone_new/1.003.005/)
                q-input(v-model="modelPath" @click="selectFolder")
                br
                q-btn(color="green" label="Save" @click="saveFolder" :loading="saving")
    q-dialog(v-model="newPatternDialog")
      q-card(style="width: 100%; max-width: 600px")
        q-card-section
          p.q-mb-none Song
          q-select(v-model="newPattern.song_id" :options="songOptions" dense emit-value map-options autofocus)
          br
          p.q-mb-none Level
          q-input.q-mb-md(v-model="newPattern.signature" dense :rules="[val => !!val || 'Field is required']")
          p.q-mb-none Line
          q-input.q-mb-md(v-model="newPattern.line" dense :rules="[val => !!val || 'Field is required']")
          p.q-mb-none Difficulty
          q-input.q-mb-md(v-model="newPattern.difficulty" dense :rules="[val => !!val || 'Field is required']")
        q-card-actions(align="right")
          q-btn(color="green" label="Submit" @click="addNewPattern")
    q-dialog(v-model="newSongDialog")
      q-card(style="width: 100%; max-width: 600px")
        q-card-section
          p.q-mb-none Name
          q-input.q-mb-md(v-model="newSong.name" dense :rules="[val => !!val || 'Field is required']")
          p.q-mb-none Full Name
          q-input.q-mb-md(v-model="newSong.full_name" dense :rules="[val => !!val || 'Field is required']")
          p.q-mb-none Genre
          q-input.q-mb-md(v-model="newSong.genre" dense :rules="[val => !!val || 'Field is required']")
          p.q-mb-none Artist Name
          q-input.q-mb-md(v-model="newSong.artist_name" dense :rules="[val => !!val || 'Field is required']")
          p.q-mb-none Loop BGA
          q-toggle(v-model="newSong.loop_bga_yn" color="primary")
          p.q-mb-none Composed By
          q-input.q-mb-md(v-model="newSong.composed_by" dense)
          p.q-mb-none Singer By
          q-input.q-mb-md(v-model="newSong.singer" dense)
          p.q-mb-none Feat By
          q-input.q-mb-md(v-model="newSong.feat_by" dense)
          p.q-mb-none Arranged By
          q-input.q-mb-md(v-model="newSong.arranged_by" dense)
          p.q-mb-none Visualized By
          q-input.q-mb-md(v-model="newSong.visualized_by" dense)
        q-card-actions(align="right")
          q-btn(color="green" label="Submit" @click="addNewSong")
</template>

<script>
import { version } from '../../package.json'
import { remote, ipcRenderer } from 'electron'

export default {
  name: 'PageIndex',
  data () {
    return {
      version,
      tab: 'settings',
      modelPath: '',
      saving: false,
      songs: [],
      customSongs: [],
      patterns: [],
      customPatterns: [],
      newSongDialog: false,
      newSong: {
        name: '',
        full_name: '',
        genre: '',
        artist_name: '',
        loop_bga_yn: false,
        composed_by: '',
        singer: '',
        feat_by: '',
        arranged_by: '',
        visualized_by: ''
      },
      songColumns: [
        { name: 'song_id', label: 'ID', field: 'song_id', sortable: true },
        { name: 'name', label: 'Name', field: 'name', sortable: true },
        { name: 'full_name', label: 'Full Name', field: 'full_name', sortable: true },
        { name: 'genre', label: 'Genre', field: 'genre', sortable: true },
        { name: 'artist_name', label: 'Artist Name', field: 'artist_name', sortable: true },
        { name: 'loop_bga_yn', label: 'Loop BGA', field: 'loop_bga_yn', sortable: true },
        { name: 'composed_by', label: 'Composed By', field: 'composed_by', sortable: true },
        { name: 'singer', label: 'Singer', field: 'singer', sortable: true },
        { name: 'feat_by', label: 'Feat By', field: 'feat_by', sortable: true },
        { name: 'arranged_by', label: 'Arranged By', field: 'arranged_by', sortable: true },
        { name: 'visualized_by', label: 'Visualized By', field: 'visualized_by', sortable: true }
      ],
      newPatternDialog: false,
      patternColumns: [
        { name: 'pattern_id', label: 'ID', field: 'pattern_id', sortable: true },
        { name: 'song_id', label: 'Song', field: 'song_id', sortable: true },
        { name: 'signature', label: 'Level', field: 'signature', sortable: true },
        { name: 'line', label: 'Line', field: 'line', sortable: true },
        { name: 'difficulty', label: 'Difficulty', field: 'difficulty', sortable: true }
      ],
      newPattern: {
        song_id: null,
        signature: '1',
        line: 4,
        difficulty: 5,
        point_type: '0',
        point_value: '0',
        flg: 'Y',
        update: 1
      }
    }
  },
  methods: {
    selectFolder () {
      remote.dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then(result => {
        if (result.filePaths.length > 0) {
          const selected = result.filePaths[0].replace(/\\/g, '/') + '/'
          this.modelPath = selected
        }
      })
    },
    saveFolder () {
      this.saving = true
      ipcRenderer.send('initPath', this.modelPath)
    },
    saveSong () {
      this.saving = true
      const songs = this.songs.concat(this.customSongs)
      ipcRenderer.send('saveSong', { path: this.settings.path, songs })
    },
    addNewSong () {
      this.customSongs.push({
        ...this.newSong,
        song_id: this.customSongs.length > 0 ? parseInt(this.customSongs[this.customSongs.length - 1].song_id) + 1 : 192,
        item_id: this.customSongs.length > 0 ? parseInt(this.customSongs[this.customSongs.length - 1].item_id) + 1 : 192,
        original_bga_yn: 'Y',
        loop_bga_yn: this.newSong.loop_bga_yn ? 'Y' : 'N',
        cost_game_point: 0,
        cost_game_cash: 0,
        flag: 0,
        status: '',
        free_yn: 'Y',
        hidden_yn: 'N',
        open_yn: 'Y',
        track_id: this.customSongs.length > 0 ? parseInt(this.customSongs[this.customSongs.length - 1].track_id) + 1 : 500,
        mod_date: '20181217000000',
        update: 1
      })
      this.newSongDialog = false
      this.newSong = {
        name: '',
        full_name: '',
        genre: '',
        artist_name: '',
        loop_bga_yn: false,
        composed_by: '',
        singer: '',
        feat_by: '',
        arranged_by: '',
        visualized_by: ''
      }
    },
    addNewPattern () {
      this.customPatterns.push({
        ...this.newPattern,
        pattern_id: this.customPatterns.length > 0 ? parseInt(this.customPatterns[this.customPatterns.length - 1].pattern_id) + 1 : 1321
      })
      this.newPattern = {
        song_id: null,
        signature: '1',
        line: 4,
        difficulty: 5,
        point_type: '0',
        point_value: '0',
        flg: 'Y',
        update: 1
      }
      this.newPatternDialog = false
    },
    getSongName (id) {
      return this.songs.concat(this.customSongs).find(song => song.song_id === id).full_name
    },
    savePattern () {
      this.saving = true
      const custompts = JSON.parse(JSON.stringify(this.customPatterns)).map(pattern => {
        pattern.line++
        return pattern
      })
      console.log(custompts)
      const pts = this.patterns.concat(custompts)
      ipcRenderer.send('savePattern', { path: this.settings.path, patterns: pts })
    }
  },
  computed: {
    settings () {
      return this.$store.getters['settings/getSettings']
    },
    songOptions () {
      return this.songs.concat(this.customSongs).map(song => {
        return {
          label: song.full_name,
          value: song.song_id
        }
      })
    },
    allSongs () {
      return this.songs.concat(this.customSongs)
    },
    allPatterns () {
      return this.patterns.concat(this.customPatterns)
    }
  },
  mounted () {
    if (this.settings.path.length > 0) {
      ipcRenderer.send('readData', this.settings.path)
    }
    this.modelPath = this.settings.path

    ipcRenderer.on('initPath-reply', (event, arg) => {
      this.saving = false
      if (arg.result) {
        this.$q.notify({
          color: 'green',
          icon: 'check',
          message: 'Saved',
          position: 'top',
          timeout: 1500
        })
        this.$store.commit('settings/savePath', this.modelPath)
        ipcRenderer.send('readData', this.settings.path)
      } else {
        this.$q.notify({
          color: 'red',
          icon: 'warning',
          message: 'Can not find server files in path.',
          position: 'top',
          timeout: 1500
        })
      }
    })

    ipcRenderer.on('readData-reply', (event, arg) => {
      this.customSongs = arg.songs.filter(song => song.song_id > 191)
      this.songs = arg.songs.filter(song => song.song_id <= 191)
      this.customPatterns = arg.patterns.filter(pattern => pattern.pattern_id > 1320).map(pattern => {
        pattern.line -= 1
        return pattern
      })
      this.patterns = arg.patterns.filter(pattern => pattern.pattern_id <= 1320)
    })

    ipcRenderer.on('saveSong-reply', (event, arg) => {
      this.saving = false
    })

    ipcRenderer.on('savePattern-reply', (event, arg) => {
      this.saving = false
    })
  }
}
</script>
