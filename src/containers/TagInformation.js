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
    const id = this.props.match.params.id
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
        <li key="negative" >{negative}, </li>
        <li key="neutral" >{neutral}, </li>
        <li key="positive" >{positive}</li>
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

  renderDaysPicker = (icon) => (<span onClick={this.toggleDays} >{icon}</span>);

  render() {
    const data = this.getTagData(this.props.rawData);
    if (!data) return null;
    const showDays = this.state.showDays;

    const { id, label, volume, type, sentiment, sentimentScore, burst, days, pageType } = data;

    return (
      <ul style={styles.containerStyle} >
        <li key="label" >label: {label}</li>
        <li key="volume" >volume: {volume}</li>
        <li key="type" >type: {type}</li>
        <li key="sentiment" style={{display: 'flex'}} >sentiment: {this.renderSentiment(sentiment)}</li>
        <li key="sentimentScore" >sentimentScore: {sentimentScore}</li>
        <li key="burst" >burst: {burst}</li>
        <li key="daysPick" >days: {showDays ? this.renderDaysPicker('-') : days.length ? this.renderDaysPicker('+') : 0}</li>
        <li key="days" >{showDays && this.renderDays(days)}</li>
        <li key="pageType" >pageType:{this.renderPageType(pageType)}</li>
      </ul>
    );
  }
}

const styles = {
  containerStyle: {listStyle: 'none'},
  pageType: {listStyle: 'none'},
  days: {listStyle: 'none'},
  sentiment: {listStyle: 'none', display: 'flex', textAlign: 'center', alignItems: 'center', padding: '0px', marginLeft: '24px'},
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