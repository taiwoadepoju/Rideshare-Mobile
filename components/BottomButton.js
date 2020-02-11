import React, { Component } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';

export default class BottomButton extends Component {
  render() {
    return (
      <View style={styles.bottomButton}>
        <TouchableOpacity onPress={() => this.props.onPressFunction()}>
          <View>
            <Text style={styles.bottomButtonText}>{this.props.buttonText}</Text>
            {this.props.loading && <ActivityIndicator animating={this.props.loading} size='large'/>}
            {this.props.children}
          </View>
        </TouchableOpacity>
      </View>
    )
  }
}

BottomButton.propTypes = {
  onPressFunction: PropTypes.func.isRequired,
  buttonText: PropTypes.string.isRequired
}

const styles = StyleSheet.create({
  bottomButton: {
    backgroundColor: 'green',
    marginTop: 'auto',
    margin: 20,
    padding: 15,
    paddingHorizontal: 30,
    alignSelf: 'center'
  },
  bottomButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: "600"
  }
})
