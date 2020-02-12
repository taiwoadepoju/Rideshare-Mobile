import React, { Component } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { StyleSheet, PermissionsAndroid, Platform, View, TouchableWithoutFeedback, Keyboard, Text, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline, Marker } from 'react-native-maps';
import PlaceInput from '../components/PlaceInput';
import PolyLine from '@mapbox/polyline';
import socketIO from 'socket.io-client';
import BottomButton from '../components/BottomButton';
import Config from 'react-native-config';

let socket = socketIO.connect("http://192.168.8.102:3000");

export default class Passenger extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasMapPermission: false,
      userLatitude: 0,
      userLongitude: 0,
      lastPosition: '',
      destinationCoordinates: [],
      routeResponse: {},
      loading: false
    }
    this.map = React.createRef();
  }



  componentDidMount() {
    this.requestFineLocation()
  }

  componentWillUnmount() {
    Geolocation.clearWatch(this.watchId)
  }

  hideKeyboard = () => {
    Keyboard.dismiss()
  }

  getUserPosition() {
    this.setState({ hasMapPermission: true })
    Geolocation.watchPosition((pos) => {
      console.log('position ===', pos)
      this.setState({
        userLatitude: pos.coords.latitude,
        userLongitude: pos.coords.longitude
      })
    }, (err) => console.warn(err)), {
      enableHighAccuracy: true
    }
    this.watchId = Geolocation.watchPosition((res) => this.setState({ lastPosition: res }))
  }

  requestFineLocation = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Permission granted...')
          this.getUserPosition()
          this.setState({ hasMapPermission: true })
        }
      }
      else {
        this.getUserPosition()
        this.setState({ hasMapPermission: true })
      }
    } catch (error) {
      console.warn(error)
    }
  }

  showDirectionsOnMap = async (placeId) => {
    const { userLongitude, userLatitude } = this.state;
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${userLatitude},${userLongitude}&destination=place_id:${placeId}&key=${Config.GOOGLE_MAPS_API_KEY}`, {
        method: "get",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      const result = await res.json()

      // converting polylines in response to an array of  latitudes and longitudes
      const points = PolyLine.decode(result.routes[0].overview_polyline.points);

      const formatLatitudeAndLongitude = points.map((point) => {
        return { latitude: point[0], longitude: point[1] }
      })
      this.setState({
        destinationCoordinates: formatLatitudeAndLongitude,
        routeResponse: result
      });
      this.map.current.fitToCoordinates(formatLatitudeAndLongitude, { edgePadding: { top: 200, bottom: 80, left: 40, right: 40 } });
    }
    catch (error) {
      throw error
    }
  }

  requestDriver = async () => {
    const { routeResponse } = this.state;
    this.setState({ loading: true })


    socket.on("connect", () => {
      console.log("Client is connected... A passenger is looking for driver")
      socket.emit("taxiRequest", routeResponse)
    })

    socket.on("driverLocation", () => {
      this.setState({ loading: false });
    })
  }

  render() {
    const { userLongitude, userLatitude, destinationCoordinates, loading } = this.state;
    console.log('~~@@~~',this.state.routeResponse)
    return (
      <TouchableWithoutFeedback onPress={this.hideKeyboard}>
        <View style={styles.container}>
          <MapView
            ref={this.map}
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
            {destinationCoordinates.length > 0 &&
              <Polyline
                coordinates={destinationCoordinates}
                strokeWidth={6}
                strokeColor="green"
              />}
            {destinationCoordinates.length > 0 &&
              <Marker
                coordinate={destinationCoordinates[destinationCoordinates.length - 1]}
              />}
          </MapView>
      
          <PlaceInput userLatitude={userLatitude} userLongitude={userLongitude} showDirectionsOnMap={this.showDirectionsOnMap} />
         {destinationCoordinates.length > 0 && <BottomButton onPressFunction={this.requestDriver} buttonText="FIND DRIVER" loading={loading}/>}
        </View>
      </TouchableWithoutFeedback>

    )
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomButton: {
    backgroundColor: "green",
    padding: 20,
    marginTop: "auto",
    marginBottom: 20
  },
  bottomButtonText: {
    color: "#fff"
  }
});
