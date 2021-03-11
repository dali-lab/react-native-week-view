import React from 'react';
import { Text, View } from 'react-native';
import moment from 'moment';
import PropTypes from 'prop-types';

import { getFormattedDate } from '../utils';
import styles from './Title.styles';

const DayNumber = ({ day, textStyle, dayColor }) => (
  <Text style={[textStyle, styles.dayNumber, { color: dayColor }]}>
    {getFormattedDate(day, 'D')}
  </Text>
);

const Title = ({
  style, selectedDate, textStyle, format,
}) => {
  const { dayBG, dayColor } = moment()
    .startOf('day')
    .diff(moment(selectedDate).startOf('day'), 'days') === 0 && format === 'ddd+'
    ? { dayBG: '#deddff', dayColor: '#2F57E9' }
    : { dayBG: '#fff', dayColor: '#000' };

  return (
    <View style={[styles.column, style]}>
      <View style={[styles.dayContainer, { backgroundColor: dayBG }]}>
        {format === 'ddd+' && (
          <DayNumber
            day={selectedDate}
            textStyle={textStyle}
            dayColor={dayColor}
          />
        )}
        <Text style={[textStyle, { color: dayColor, fontSize: 12 }]}>
          {getFormattedDate(selectedDate, format)}
        </Text>
      </View>
    </View>
  );
};

Title.propTypes = {
  selectedDate: PropTypes.object.isRequired,
  style: PropTypes.object,
  textStyle: PropTypes.object,
  format: PropTypes.string,
};

export default React.memo(Title);
