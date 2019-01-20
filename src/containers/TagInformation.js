import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';
import WithRawData from '../decorators/WithRawData';

class TagInformation extends Component {
  state = {showDays: false}

  componentDidUpdate() {
    const tagData = this.getTagData(this.props.rawData);
    if (!tagData && !this.props.rawData.isFetching) {
      this.props.history.replace('/notFound');
    }
  }

  getTagData = (rawData) => {
    const id = decodeURIComponent(this.props.match.params.id)
    let data;
    if (rawData.data) {
      data = rawData.data.find(i => i.id === id);
    }
    return data;
  }

  toggleDays = () => this.setState(({showDays}) => ({showDays: !showDays}));

  renderDays = (days) => {
    if (!days.length) {
      return null;
    }
    const list = days.map((i, ind) => {
      return (
        <li key={ind} >{`${(new Date(i.date)).toLocaleDateString()} - ${i.volume}`}</li>
      );
    });
    return (<ul style={styles.days} >{list}</ul>)
  }

  renderSentiment = (sentiment) => {
    const {negative = 0, neutral = 0, positive = 0} = sentiment;
    return (
      <ul style={styles.sentiment} >
        <li key="negative" className="badge badge-secondary" >negative {negative}</li>
        <li key="neutral" className="badge badge-secondary" style={{marginLeft: '8px'}} >neutral {neutral}</li>
        <li key="positive" className="badge badge-secondary" style={{marginLeft: '8px'}} >positive {positive}</li>
      </ul>
    );
  }

  renderPageType = (pageType) => {
    //blog, facebook, forum, general, image, news, review, twitter, video,
    return (
      <ul style={styles.pageType} >
      {Object.keys(pageType).map(i => (<li key={i} >{`${i}: ${pageType[i]}`}</li>))}
      </ul>
    );
  }

  renderDaysPicker = (icon) => (
    <div style={styles.daysPicker} onClick={this.toggleDays} key="daysPicker" >
      {icon}
    </div>
  );


  render() {
    const data = this.getTagData(this.props.rawData);
    if (!data) return null;
    const showDays = this.state.showDays;

    const { label, volume, type, sentiment, sentimentScore, burst, days, pageType } = data;

    const listItems = [
      {key: 'label', rows: ['label:', label]},
      {key: 'volume', rows: ['volume:', volume]},
      {key: 'type', rows: ['type:', type]},
      {key: 'sentimentScore', rows: ['sentimentScore:', sentimentScore]},
      {key: 'sentiment', rows: ['sentiment:', () => this.renderSentiment(sentiment)]},
      {key: 'burst', rows: ['burst:', burst]},
      {key: 'daysPick', rows: [
          () => (['days: ', (showDays ? this.renderDaysPicker('-') : days.length ? this.renderDaysPicker('+') : 0)]),
          () => (showDays && this.renderDays(days))
      ]},
      {key: 'pageType', rows: ['sentiment:', () => this.renderPageType(pageType)]},
    ];

    const renderIt = (it) => typeof it === 'function' ? it() : it

    return (
      <ul style={styles.containerStyle} className="list-group list-group-flush" key="tagInformation" >
        {listItems.map(i => (
          <li key={i.key} className="list-group-item" style={styles.listItems} >
            {i.rows && [
              <div style={{display: 'flex', flex: 2}} key="0" >{renderIt(i.rows[0])}</div>,
              <div style={{flex: 10}} key="1" >{renderIt(i.rows[1])}</div>
            ]}
          </li>
        ))}
      </ul>
    );
  }
}

const styles = {
  listItems: {display: 'flex',},
  containerStyle: {listStyle: 'none'},
  pageType: {listStyle: 'none', padding: '0px'},
  days: {listStyle: 'none', padding: '0px'},
  sentiment: {listStyle: 'none', display: 'flex', alignItems: 'center', padding: '0px'},
  daysPicker: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%',
    height: '1.5em', width: '1.5em', backgroundColor: '#e3f2fd', marginLeft: '1.5em',
  }
};

const TagInformationRenderer = {};

TagInformationRenderer.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    volume: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    sentiment: PropTypes.shape({
      negative: PropTypes.number,
      neutral: PropTypes.number,
      positive: PropTypes.number,
    }).isRequired,
    sentimentScore: PropTypes.number.isRequired,
    burst: PropTypes.number.isRequired,
    days: PropTypes.arrayOf(PropTypes.shape({
      date: PropTypes.string.isRequired,
      volume: PropTypes.number.isRequired,
    })).isRequired,
    pageType: PropTypes.shape({
      blog: PropTypes.number.isRequired,
      facebook: PropTypes.number.isRequired,
      forum: PropTypes.number.isRequired,
      general: PropTypes.number.isRequired,
      image: PropTypes.number.isRequired,
      news: PropTypes.number.isRequired,
      review: PropTypes.number.isRequired,
      twitter: PropTypes.number.isRequired,
      video: PropTypes.number.isRequired,
    }).isRequired,
  }),
};

export default withRouter(WithRawData(TagInformation));