import React from 'react';
import PropTypes from 'prop-types';
import { Text, View } from 'react-native';

import moment from 'moment';
import {
  getFormattedDate,
  calculateDaysArray,
  availableNumberOfDays,
} from '../utils';
import styles from './Header.styles';

const getDayTextStyles = (numberOfDays) => {
  const fontSize = numberOfDays === 7 ? 12 : 14;
  return {
    fontSize,
  };
};

const DayNumber = ({ day, textStyle, dayColor }) => (
  <Text style={[textStyle, styles.dayNumber, { color: dayColor }]}>
    {getFormattedDate(day, 'D')}
  </Text>
);

const Column = ({
  column, numberOfDays, format, style, textStyle,
}) => {
  const { dayBG, dayColor } = moment().startOf('day').diff(moment(column), 'days') === 0 && format === 'ddd+'
    ? { dayBG: '#deddff', dayColor: '#2F57E9' }
    : { dayBG: '#fff', dayColor: '#000' };

  return (
    <View style={[styles.column, style]}>
      <View style={[styles.dayContainer, { backgroundColor: dayBG }]}>
        {format === 'ddd+' && (
          <DayNumber day={column} textStyle={textStyle} dayColor={dayColor} />
        )}
        <Text
          style={[
            getDayTextStyles(numberOfDays),
            textStyle,
            { color: dayColor },
          ]}
        >
          {getFormattedDate(column, format)}
        </Text>
      </View>
    </View>
  );
};

const Columns = ({
  columns, numberOfDays, format, style, textStyle,
}) => {
  return (
    <View style={styles.columns}>
      {columns.map((column) => {
        return (
          <Column
            style={style}
            textStyle={textStyle}
            key={column}
            column={column}
            numberOfDays={numberOfDays}
            format={format}
          />
        );
      })}
    </View>
  );
};

const WeekViewHeader = ({
  numberOfDays,
  initialDate,
  formatDate,
  style,
  textStyle,
  rightToLeft,
}) => {
  const columns = calculateDaysArray(initialDate, numberOfDays, rightToLeft);
  return (
    <View style={styles.container}>
      {columns && (
        <Columns
          format={formatDate}
          columns={columns}
          numberOfDays={numberOfDays}
          style={style}
          textStyle={textStyle}
        />
      )}
    </View>
  );
};

WeekViewHeader.propTypes = {
  numberOfDays: PropTypes.oneOf(availableNumberOfDays).isRequired,
  initialDate: PropTypes.string.isRequired,
  formatDate: PropTypes.string,
  style: PropTypes.object,
  textStyle: PropTypes.object,
  rightToLeft: PropTypes.bool,
};

WeekViewHeader.defaultProps = {
  formatDate: 'MMM D',
};

export default React.memo(WeekViewHeader);
