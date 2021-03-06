import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  ScrollView,
  Animated,
  VirtualizedList,
  InteractionManager,
} from 'react-native';
import moment from 'moment';
import memoizeOne from 'memoize-one';

import Event from '../Event/Event';
import Events from '../Events/Events';
import Header from '../Header/Header';
import Times from '../Times/Times';
import styles from './WeekView.styles';
import {
  TIME_LABELS_IN_DISPLAY,
  CONTAINER_HEIGHT,
  DATE_STR_FORMAT,
  availableNumberOfDays,
  setLocale,
  CONTAINER_WIDTH,
} from '../utils';
import Title from '../Title/Title';
import AllDayEvents from '../AllDayEvents';

const MINUTES_IN_DAY = 60 * 24;

export default class WeekView extends Component {
  constructor(props) {
    super(props);
    this.eventsGrid = null;
    this.verticalAgenda = React.createRef();
    this.header = null;
    this.allDay = null;
    this.pageOffset = 2;
    this.currentPageIndex = this.pageOffset;
    this.eventsGridScrollX = new Animated.Value(0);
    this.state = {
      currentMoment: props.selectedDate,
      initialDates: this.calculatePagesDates(
        props.selectedDate,
        props.numberOfDays,
        props.prependMostRecent,
      ),
    };

    setLocale(props.locale);
  }

  componentDidMount() {
    // eslint-disable-next-line no-undef
    requestAnimationFrame(() => {
      this.scrollToVerticalStart();
    });
    this.eventsGridScrollX.addListener((position) => {
      this.header?.scrollToOffset({ offset: position.value, animated: false });
      this.allDay?.scrollToOffset({ offset: position.value, animated: false });
    });
  }

  componentDidUpdate(prevprops) {
    if (this.props.locale !== prevprops.locale) {
      setLocale(this.props.locale);
    }
  }

  componentWillUnmount() {
    this.eventsGridScrollX.removeAllListeners();
  }

  calculateTimes = memoizeOne((hoursInDisplay) => {
    const times = [];
    const timeLabelsPerHour = TIME_LABELS_IN_DISPLAY / hoursInDisplay;
    const minutesStep = 60 / timeLabelsPerHour;
    for (let timer = 0; timer < MINUTES_IN_DAY; timer += minutesStep) {
      let minutes = timer % 60;
      if (minutes < 10) minutes = `0${minutes}`;
      const hour = Math.floor(timer / 60);
      const timeString = minutes === '00' ? this.formatTime(hour) : `${hour}:${minutes}`;
      times.push(timeString);
    }
    return times;
  });

  /**
   * Convert XX:00 to XX am/pm. Added by Whiteboard.
   * @param {number} hour in 24h format
   * @returns {string} formatted time string
   */
  formatTime = (hour) => `${((hour + 11) % 12) + 1} ${hour < 12 ? 'am' : 'pm'}`;

  scrollToVerticalStart = () => {
    // Changed by Whiteboard. Modified if block to not require indentation.
    if (!this.verticalAgenda) return;

    const { startHour, hoursInDisplay } = this.props;
    const startHeight = (startHour * CONTAINER_HEIGHT) / hoursInDisplay;
    // Added 'current' because it would not work otherwise
    this.verticalAgenda.current?.scrollTo({
      y: startHeight,
      x: 0,
      animated: false,
    });
  };

  scrollEnded = (event) => {
    const {
      nativeEvent: { contentOffset, contentSize },
    } = event;
    const { x: position } = contentOffset;
    const { width: innerWidth } = contentSize;
    const {
      onSwipePrev,
      onSwipeNext,
      numberOfDays,
      prependMostRecent,
    } = this.props;
    const { currentMoment, initialDates } = this.state;

    const newPage = Math.round((position / innerWidth) * initialDates.length);
    const movedPages = newPage - this.currentPageIndex;
    this.currentPageIndex = newPage;

    if (movedPages === 0) {
      return;
    }

    InteractionManager.runAfterInteractions(() => {
      const daySignToTheFuture = prependMostRecent ? -1 : 1;
      const newMoment = moment(currentMoment)
        .add(movedPages * numberOfDays * daySignToTheFuture, 'd')
        .toDate();

      const newState = {
        currentMoment: newMoment,
      };

      if (movedPages < 0 && newPage < this.pageOffset) {
        const first = initialDates[0];
        const daySignToThePast = daySignToTheFuture * -1;
        const addDays = numberOfDays * daySignToThePast;
        const initialDate = moment(first).add(addDays, 'd');
        initialDates.unshift(initialDate.format(DATE_STR_FORMAT));
        this.currentPageIndex += 1;
        this.eventsGrid?.scrollToIndex({
          index: this.currentPageIndex,
          animated: false,
        });

        newState.initialDates = [...initialDates];
      } else if (
        movedPages > 0
        && newPage > this.state.initialDates.length - this.pageOffset
      ) {
        const latest = initialDates[initialDates.length - 1];
        const addDays = numberOfDays * daySignToTheFuture;
        const initialDate = moment(latest).add(addDays, 'd');
        initialDates.push(initialDate.format(DATE_STR_FORMAT));

        newState.initialDates = [...initialDates];
      }

      this.setState(newState);

      if (movedPages < 0) {
        onSwipePrev && onSwipePrev(newMoment);
      } else {
        onSwipeNext && onSwipeNext(newMoment);
      }
    });
  };

  eventsGridRef = (ref) => {
    this.eventsGrid = ref;
  };

  verticalAgendaRef = (ref) => {
    this.verticalAgenda = ref;
  };

  headerRef = (ref) => {
    this.header = ref;
  };

  allDayRef = (ref) => {
    this.allDay = ref;
  }

  calculatePagesDates = (currentMoment, numberOfDays, prependMostRecent) => {
    const initialDates = [];
    for (let i = -this.pageOffset; i <= this.pageOffset; i += 1) {
      const initialDate = moment(currentMoment).add(numberOfDays * i, 'd');
      initialDates.push(initialDate.format(DATE_STR_FORMAT));
    }
    return prependMostRecent ? initialDates.reverse() : initialDates;
  };

  sortEventsByDate = memoizeOne((events) => {
    // Stores the events hashed by their date
    // For example: { "2020-02-03": [event1, event2, ...] }
    // If an event spans through multiple days, adds the event multiple times
    const sortedEvents = {};
    events.forEach((event) => {
      const startDate = moment(event.startDate);
      const endDate = moment(event.endDate);

      for (
        let date = moment(startDate);
        date.isSameOrBefore(endDate, 'days');
        date.add(1, 'days')
      ) {
        // Calculate actual start and end dates
        const startOfDay = moment(date).startOf('day');
        const endOfDay = moment(date).endOf('day');
        const actualStartDate = moment.max(startDate, startOfDay);
        const actualEndDate = moment.min(endDate, endOfDay);

        // Add to object
        const dateStr = date.format(DATE_STR_FORMAT);
        if (!sortedEvents[dateStr]) {
          sortedEvents[dateStr] = [];
        }
        sortedEvents[dateStr].push({
          ...event,
          startDate: actualStartDate.toDate(),
          endDate: actualEndDate.toDate(),
        });
      }
    });
    // For each day, sort the events by the minute (in-place)
    Object.keys(sortedEvents).forEach((date) => {
      sortedEvents[date].sort((a, b) => {
        return moment(a.startDate).diff(b.startDate, 'minutes');
      });
    });
    return sortedEvents;
  });

  getListItemLayout = (index) => ({
    length: CONTAINER_WIDTH,
    offset: CONTAINER_WIDTH * index,
    index,
  });

  render() {
    const {
      numberOfDays,
      headerStyle,
      headerTextStyle,
      hourTextStyle,
      eventContainerStyle,
      formatDateHeader,
      onEventPress,
      onEventLongPress,
      sendCallback,
      events,
      // allDayEvents,
      hoursInDisplay,
      onGridClick,
      EventComponent,
      prependMostRecent,
      rightToLeft,
      selectedDate,
    } = this.props;
    const { initialDates } = this.state;
    const times = this.calculateTimes(hoursInDisplay);
    const eventsByDate = this.sortEventsByDate(events);
    // const allDayEventsByDate = this.sortEventsByDate(allDayEvents);
    const horizontalInverted = (prependMostRecent && !rightToLeft)
      || (!prependMostRecent && rightToLeft);

    return (
      <View style={styles.container}>
        {numberOfDays === 1 ? (
          <Title
            style={headerStyle}
            textStyle={headerTextStyle}
            selectedDate={selectedDate}
            format={formatDateHeader}
          />
        ) : (
          <View style={styles.headerContainer}>
            <View
              style={{
                width: 60,
              }}
            />
            <VirtualizedList
              horizontal
              pagingEnabled
              inverted={horizontalInverted}
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
              ref={this.headerRef}
              data={initialDates}
              getItem={(data, index) => data[index]}
              getItemCount={(data) => data.length}
              getItemLayout={(_, index) => this.getListItemLayout(index)}
              keyExtractor={(item) => item}
              initialScrollIndex={this.pageOffset}
              renderItem={({ item }) => {
                return (
                  <View key={item} style={styles.header}>
                    <Header
                      style={headerStyle}
                      textStyle={headerTextStyle}
                      formatDate={formatDateHeader}
                      initialDate={item}
                      numberOfDays={numberOfDays}
                      rightToLeft={rightToLeft}
                    />
                  </View>
                );
              }}
            />
          </View>
        )}
        {/**
         * Attempt to display all-day events at top of calendar
         * This is probably the best way to implement with this library
         * Need to figure out way to make height dynamic to amount of contents inside
         * Need to figure out how to implement dragging features
         * Need to control EventComponent dimensions and placement
         * AllDayEvent's methods need to be changed for sure
         */}
        {/* <View style={styles.headerContainer}>
          <View style={{ width: 60, height: 90, backgroundColor: 'white' }} />
          <VirtualizedList
            horizontal
            pagingEnabled
            inverted={horizontalInverted}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            data={initialDates}
            ref={this.allDayRef}
            getItem={(data, index) => data[index]}
            getItemCount={(data) => data.length}
            getItemLayout={(_, index) => this.getListItemLayout(index)}
            keyExtractor={(item) => item}
            initialScrollIndex={this.pageOffset}
            renderItem={({ item }) => (
              <AllDayEvents
                key={item.toString()}
                eventsByDate={allDayEventsByDate}
                initialDate={item.toString()}
                numberOfDays={numberOfDays}
                onEventPress={onEventPress}
                onEventLongPress={onEventLongPress}
                sendCallback={sendCallback}
                onGridClick={onGridClick}
                hoursInDisplay={hoursInDisplay}
                EventComponent={EventComponent}
                eventContainerStyle={eventContainerStyle}
                rightToLeft={rightToLeft}
              />
            )}
          />
        </View> */}
        {/* Fixed below reference */}
        <ScrollView
          ref={this.verticalAgenda}
          onScroll={this.props.handleScroll}
          scrollEventThrottle={64}
        >
          <View style={styles.scrollViewContent}>
            <Times times={times} textStyle={hourTextStyle} />
            <VirtualizedList
              data={initialDates}
              getItem={(data, index) => data[index]}
              getItemCount={(data) => data.length}
              getItemLayout={(_, index) => this.getListItemLayout(index)}
              keyExtractor={(item) => item}
              initialScrollIndex={this.pageOffset}
              renderItem={({ item }) => {
                return (
                  <Events
                    key={item.toString()}
                    times={times}
                    eventsByDate={eventsByDate}
                    initialDate={item.toString()}
                    numberOfDays={numberOfDays}
                    onEventPress={onEventPress}
                    onEventLongPress={onEventLongPress}
                    sendCallback={sendCallback}
                    onGridClick={onGridClick}
                    hoursInDisplay={hoursInDisplay}
                    EventComponent={EventComponent}
                    eventContainerStyle={eventContainerStyle}
                    rightToLeft={rightToLeft}
                  />
                );
              }}
              horizontal
              pagingEnabled
              inverted={horizontalInverted}
              onMomentumScrollEnd={this.scrollEnded}
              scrollEventThrottle={32}
              onScroll={Animated.event(
                [
                  {
                    nativeEvent: {
                      contentOffset: {
                        x: this.eventsGridScrollX,
                      },
                    },
                  },
                ],
                { useNativeDriver: false },
              )}
              ref={this.eventsGridRef}
            />
          </View>
        </ScrollView>
      </View>
    );
  }
}

WeekView.propTypes = {
  events: PropTypes.arrayOf(Event.propTypes.event),
  // allDayEvents: PropTypes.arrayOf(Event.propTypes.event),
  formatDateHeader: PropTypes.string,
  numberOfDays: PropTypes.oneOf(availableNumberOfDays).isRequired,
  onSwipeNext: PropTypes.func,
  onSwipePrev: PropTypes.func,
  onEventPress: PropTypes.func,
  onEventLongPress: PropTypes.func,
  sendCallback: PropTypes.func,
  onGridClick: PropTypes.func,
  headerStyle: PropTypes.object,
  headerTextStyle: PropTypes.object,
  hourTextStyle: PropTypes.object,
  eventContainerStyle: PropTypes.object,
  selectedDate: PropTypes.instanceOf(moment).isRequired,
  locale: PropTypes.string,
  hoursInDisplay: PropTypes.number,
  startHour: PropTypes.number,
  EventComponent: PropTypes.elementType,
  rightToLeft: PropTypes.bool,
  prependMostRecent: PropTypes.bool,
  handleScroll: PropTypes.func,
};

WeekView.defaultProps = {
  events: [],
  locale: 'en',
  hoursInDisplay: 6,
  startHour: 0,
  rightToLeft: false,
  prependMostRecent: false,
};
