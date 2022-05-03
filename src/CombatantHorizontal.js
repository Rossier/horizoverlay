import React, { Component } from 'react'
import { bool, string, number, object, oneOfType } from 'prop-types'
import { jobRoles, otherIcons } from './helpers'
var images = require.context('./images', false, /\.png$/)

DataWrapper.propTypes = {
  text: oneOfType([string, number]).isRequired,
  label: string,
  relevant: oneOfType([bool, string, number]).isRequired
}
DataText.propTypes = {
  type: string.isRequired,
  show: bool,
  data: object
}
DamageBar.propTypes = {
  width: string,
  show: bool.isRequired
}

export default class CombatantHorizontal extends Component {
  static propTypes = {
    encounterDamage: oneOfType([string, number]).isRequired,
    rank: number,
    data: object.isRequired,
    config: object.isRequired,
    isSelf: bool.isRequired
  }
  render() {
    const { config, data, isSelf } = this.props
    const order = this.props.rank
    const jobName = data.Job || 'WHO?'
    const name = data.name.toLowerCase()
    let jobStyleClass, jobIcon, damageWidth, critPct

    // don't need to render this component if this is a limit break
    if (!data.Job && name === 'limit break') return null

    // Color theme byRole
    if (config.color === 'byRole' || config.color === 'byJob') {
      for (const role in jobRoles) {
        if (jobRoles[role].indexOf(data.Job.toLowerCase()) >= 0)
          jobStyleClass = `job-${role}`
        if (data.Job === '') {
          for (const job of jobRoles[role]) {
            if (name.indexOf(job) >= 0) jobStyleClass = `job-${role}`
          }
        }
      }
      jobStyleClass += config.color === 'byJob' ? ` ${data.Job}` : ""
    } else {
      jobStyleClass = ''
    }

    // Damage Percent
    damageWidth = `${parseInt(
      data.damage / this.props.encounterDamage * 100,
      10
   )}%`

    critPct = `${parseInt(
      data.crithits / data.hits * 100,
      10
    )}%`

    // Job icon
    if (config.showJobIcon) {
      jobIcon = './'
      if (data.Job === '') {
        // well there are a lot of things that doesn't have a job, like summoner's pets and alike. Lets assume them all.
        let newIcon
        newIcon = 'error'
        for (const otherIcon of otherIcons) {
          if (name.indexOf(otherIcon) >= 0) newIcon = otherIcon
        }
        jobIcon += newIcon
      } else {
        jobIcon += data.Job.toLowerCase()
      }
      try {
        jobIcon = images(`${jobIcon}.png`)
      } catch (e) {
        console.error(e)
        jobIcon = images('./empty.png')
      }
    }

    // Character name (self, instead of 'YOU')
    const characterName = isSelf ? config.characterName : data.name

    const isHealing = data.ENCHPS > data.ENCDPS

    let maxhit
    if (data.maxhit) maxhit = data.maxhit.replace('-', ': ')
    return (
      <div
        className={`row ${jobStyleClass}${
          isSelf && config.showSelf ? ' self' : ''
        }`}
        style={{ order }}
      >
        <div className="name">
          {config.showRank ? (
            <span className="rank">{`${this.props.rank}. `}</span>
          ) : (
            ''
          )}
          <span className={`character-name ${ !isSelf && config.enableStreamerMode ? 'streamer-mode' : '' }`}>{characterName}</span>
        </div>
        <div
          className={`data-items${config.showHighlight ? ' highlight' : ''}${
            isHealing ? ' inverse' : ''
          }`}
        >
          {jobIcon && <img src={jobIcon} className="job" alt={jobName} />}
          <DataText type="pct" show={config.showFFLogsPCT} {...data} />
          <DataText type="hps" show={config.showHps} {...data} />
          <DataText type="job" show={!config.showHps && !config.showFFLogsPCT} {...data} />
          <DataText type="dps" {...data} />
        </div>
        <DamageBar width={damageWidth} show={config.showDamagePercent} crit={critPct} dhit={data.DirectHitPct} cdhit={data.CritDirectHitPct} />
        <div className="maxhit">{config.showMaxhit && maxhit}</div>
      </div>
    )
  }
}

function DamageBar({ width, show, crit, dhit, cdhit }) {
  if (!show) return null
  return (
    <div>
      <div className="damage-percent-bg">
        <div className="damage-percent-fg" style={{ width }} />
      </div>
      <div className="damage-percent">CH:<br/>{crit}</div>
      <div className="damage-percent">DH:<br/>{dhit}</div>
      <div className="damage-percent">CDH:<br/>{cdhit}</div>
      <div className="damage-percent">DMG:<br/>{width}</div>
    </div>
  )
}

function OverhealColor(over_heal, isBlack) {
  let r_color = over_heal * 255
  if (r_color > 255) {r_color = 255}
  if (isBlack) {
    return `rgb(${r_color}, 0, 0)`
  } else {
    r_color = 255 - r_color
    return `rgb(255, ${r_color}, ${r_color})`
  }
}

function DataWrapper(props) {
  return (
    <div className={props.relevant ? props.label.toLowerCase() : props.label.toLowerCase()+' irrelevant'} style={{color: OverhealColor(props.overheal, false)}}>
      <div>
        <span className="damage-stats">{props.text}</span>
        <span className="label">{props.label}</span>
      </div>
    </div>
  )
}

function DataText({ type, show = true, ...data } = {}) {
  if (!show) return null
  let text, label, relevant, overheal
  switch (type) {
    case 'hps':
      text = data.ENCHPS
      label = ' HPS'
      relevant = data.ENCHPS > data.ENCDPS
      overheal = data.overHeal / data.healed
      break
    case 'pct':
      text = data.Percentile
      label = ' pct'
      relevant = data.Percentile > data.ENCHPS
      overheal = 0
      break
    case 'dps':
      text = data.ENCDPS
      label = ' DPS'
      relevant = data.ENCDPS > data.ENCHPS
      overheal = 0
      break
    case 'job':
      text = data.Job.toUpperCase()
      label = ''
      relevant = '1'
      overheal = 0
      break
    default:
  }
  return <DataWrapper text={text} label={label} relevant={relevant} overheal={overheal}/>
}
