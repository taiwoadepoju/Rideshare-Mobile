import React, { Component } from 'react';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps'; // remove PROVIDER_GOOGLE import if not using Google Maps
import { View, StyleSheet } from 'react-native';

class MapScreen extends Component {

  render() {
    const { userLongitude, userLatitude } = this.props;
    console.log('user location ==', userLatitude, userLongitude)

    return (
      <View style={styles.container}>
        <MapView
          innerRef={this.props.innerRef}
          showsUserLocation
          followsUserLocation
          provider={PROVIDER_GOOGLE} // remove if not using Google Maps
          style={styles.map}
          region={{
            latitude: userLatitude,
            longitude: userLongitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
          }}
        >
          {this.props.children}
        </MapView>
      </View>
    )
  }
}

export default React.forwardRef((props, ref) => (
  <MapScreen innerRef={ref} {...props}/>
))


const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
