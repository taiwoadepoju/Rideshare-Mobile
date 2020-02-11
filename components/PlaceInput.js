import React, { Component } from 'react'
import { Text, StyleSheet, View, TextInput, TouchableOpacity, Keyboard } from 'react-native'
import _ from 'lodash';

export default class PlaceInput extends Component {
  state = {
    locationList: [],
    locationText: '',
    placeId: ''
  }

  async getPlaces() {
    const { userLongitude, userLatitude } = this.props;
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?key=AIzaSyCUmHpb7qdmoMy_yUdqfReGTfwmwo2aTG0&input=${this.state.locationText}&location=${userLatitude},${userLongitude}&radius=2000`, {
        method: "get",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      const data = res.json()
      const json = await Promise.all([data])
      this.setState({ locationList: json[0].predictions })
    }
    catch (error) {
      throw error
    }
  }

  handleChange(text) {
    this.getPlacesDebounced = _.debounce(this.getPlaces, 1000);
    this.setState({ locationText: text }, () => this.getPlacesDebounced() )
  }

  handleSelectLocation(item) {
    Keyboard.dismiss()
    this.setState({ locationText: item.structured_formatting.main_text, locationList: [] });
    this.props.showDirectionsOnMap(item.place_id);
  }

  render() {
    const { locationList, locationText } = this.state;
    const { locationListStyle, secondaryText, placeInputStyle } = styles;
    console.log(locationText)

    return (
      <View>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(text) => this.handleChange(text)}
          style={placeInputStyle}
          placeholder="Where to?"
          value={locationText}
        />
        {locationList && <View>
          {locationList.map((item) =>
          <TouchableOpacity key={item.id} onPress={() => this.handleSelectLocation(item)}>
             <View style={locationListStyle}>
              <Text>{item.structured_formatting.main_text}</Text>
              <Text style={secondaryText}>{item.structured_formatting.secondary_text}</Text>
            </View>
          </TouchableOpacity>
           
          )}
        </View>}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  placeInputStyle: {
    marginTop: 80,
    height: 60,
    width: 400,
    padding: 10,
    backgroundColor: 'white'
  },
  locationListStyle: {
    backgroundColor: 'white',
    padding: 10
  },
  secondaryText: {
    color: '#777'
  }
})
