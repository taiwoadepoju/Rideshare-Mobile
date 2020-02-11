import React, { Component } from 'react';
import { StyleSheet, View, Button } from 'react-native';
import Driver from './screens/Driver';
import Passenger from './screens/Passenger';


export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isDriver: false,
      isPassenger: false,
      hideButton: false
    }
  }

  render() {
    const { isDriver, isPassenger, hideButton } = this.state;
    return (
      <View style={styles.container}>
        {!hideButton  && <Button title="Passenger" onPress={() => this.setState({ isPassenger: true, hideButton: true })} />}
        {!hideButton && <Button title="Driver" onPress={() => this.setState({ isDriver: true, hideButton: true })} />}
        {isDriver && <Driver />}
        {isPassenger && <Passenger />}
      </View>


    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 80,
  }
});
