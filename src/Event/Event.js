import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Text, Pressable, View } from 'react-native';
import styles from './Event.styles';

const Event = ({
  event,
  onPress,
  onLongPress,
  sendCallback,
  position,
  EventComponent,
  containerStyle,
}) => {
  const [activeLongPress, setActiveLongPress] = useState(false);
  return (
    <Pressable
      onPress={() => onPress && onPress(event)}
      onLongPress={() => {
        setActiveLongPress(true);
        if (onLongPress) onLongPress(event, position);
      }}
      onPressOut={() => setActiveLongPress(false)}
      style={[styles.item, position, containerStyle, { overflow: 'visible' }]}
      disabled={!onPress}
    >
      {EventComponent ? (
        <EventComponent
          event={event}
          position={position}
          activeLongPress={activeLongPress}
          sendCallback={
            sendCallback
            || ((data) => {
              // eslint-disable-next-line no-console
              console.log(data);
            })
          }
        />
      ) : (
        <View style={{ backgroundColor: styles.color }}>
          <Text style={styles.description}>{event.name}</Text>
        </View>
      )}
    </Pressable>
  );
};

const eventPropType = PropTypes.shape({
  color: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  description: PropTypes.string,
  startDate: PropTypes.object.isRequired,
  endDate: PropTypes.object.isRequired,
});

const positionPropType = PropTypes.shape({
  height: PropTypes.number,
  width: PropTypes.number,
  top: PropTypes.number,
  left: PropTypes.number,
});

Event.propTypes = {
  event: eventPropType.isRequired,
  onPress: PropTypes.func,
  onLongPress: PropTypes.func,
  sendCallback: PropTypes.func,
  position: positionPropType,
  containerStyle: PropTypes.object,
  EventComponent: PropTypes.elementType,
};

export default Event;
