import React, { Component } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { StyleSheet, PermissionsAndroid, Platform, View, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline, Marker } from 'react-native-maps';
import Config from 'react-native-config';
import PolyLine from '@mapbox/polyline';
import socketIO from 'socket.io-client';
import BottomButton from '../components/BottomButton';

let socket = socketIO.connect("http://192.168.8.102:3000");

export default class Driver extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasMapPermission: false,
      userLatitude: 0,
      userLongitude: 0,
      lastPosition: '',
      destinationCoordinates: [],
      loading: false,
      passengerFound: false,
      buttonText: "FIND PASSENGER"
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
    // console.log('watchid', this.watchId)
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

  getRouteDirections = async (placeId) => {
    console.log('place ID',placeId)
    const { userLongitude, userLatitude } = this.state;
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${userLatitude},${userLongitude}&destination=place_id:${placeId}&key=${Config.GOOGLE_MAPS_API_KEY}`, {
        method: "get",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      const data = res.json()
      const json = await Promise.all([data])
      const result = json[0]

      // converting polylines in response to an array of  latitudes and longitudes
      const points = PolyLine.decode(result.routes[0].overview_polyline.points);

      const formatLatitudeAndLongitude = points.map((point) => {
        return { latitude: point[0], longitude: point[1] }
      })
      this.setState({ destinationCoordinates: formatLatitudeAndLongitude, loading: false });
      this.map.current.fitToCoordinates(formatLatitudeAndLongitude, { edgePadding: { top: 200, bottom: 80, left: 40, right: 40 } });
    }
    catch (error) {
      throw error
    }
  }

  findPasengers = () => {
    this.setState({ loading: true })

    socket.on("connect", () => {
      socket.emit("passengerRequest");
    });

    socket.on("taxiRequest", routeResponse => {
      this.getRouteDirections(routeResponse.geocoded_waypoints[0].place_id);
      this.setState({ loading: false, passengerFound: true, buttonText: "FOUND PASSENGER! ACCEPT RIDE?" });
    })
    
  }

  acceptPassengerRequest = () => {
    const { latitude, longitude } = this.state;
    socket.emit("driverLocation", { latitude, longitude });
  }


  render() {
    const { userLongitude, userLatitude, destinationCoordinates, loading, passengerFound, buttonText } = this.state;
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
                strokeColor="red"
              />}
            {destinationCoordinates.length > 0 &&
              <Marker coordinate={destinationCoordinates[destinationCoordinates.length - 1]}>
                <Image style={{ width: 40, height: 40 }} source={require("../images/person_marker_icon.png")} />
               
              </Marker>
            }
          </MapView>
          <BottomButton onPressFunction={passengerFound ? this.acceptPassengerRequest : this.findPasengers} buttonText={buttonText} loading={loading}/>

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
  }
});
