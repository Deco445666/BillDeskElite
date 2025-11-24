import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, Dimensions, TouchableOpacity, TextInput, Modal,
  SafeAreaView, StatusBar, ActivityIndicator, FlatList, Alert, Linking, Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Plus, X, ShieldCheck, Zap, History } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = 230;
// Generic Axis Link - In production you would make this dynamic per card
const BANK_URL = 'https://pgi.billdesk.com/pgidsk/pgmerc/axiscard/axis_card.jsp';

const THEME = {
  bg: '#000000',
  gold: '#D4AF37',
  surface: '#121212',
  text: '#FFFFFF',
  dim: '#666666'
};

const getGhostScript = (card, amount, email, phone) => `
  (function() {
    const log = (msg) => window.ReactNativeWebView.postMessage(JSON.stringify({type: 'LOG', msg}));
    async function type(sel, txt) {
       const el = document.querySelector(sel) || document.getElementById(sel);
       if(!el) return;
       el.value = ''; el.dispatchEvent(new Event('input'));
       for(let c of txt) { el.value += c; el.dispatchEvent(new Event('input')); await new Promise(r=>setTimeout(r,50)); }
    }
    
    setTimeout(async () => {
       // 4-Box Logic
       const inputs = Array.from(document.querySelectorAll('input'));
       const boxes = inputs.filter(i => i.maxLength === 4 && i.type !== 'hidden');
       if(boxes.length >= 4) {
          const parts = ['${card.number.slice(0,4)}', '${card.number.slice(4,8)}', '${card.number.slice(8,12)}', '${card.number.slice(12,16)}'];
          for(let i=0; i<4; i++) { if(boxes[i]) { boxes[i].value = parts[i]; boxes[i].dispatchEvent(new Event('input')); } }
       } else {
          await type('input[name*="card"]', '${card.number}');
       }
       await type('input[name*="amount"]', '${amount}');
       await type('input[name*="mail"]', '${email}');
       await type('input[name*="mobile"]', '${phone}');
    }, 1500);
  })();
`;

// LUXURY CARD COMPONENT
const LuxuryCard = ({ item, index, scrollX, onPress }) => {
  const rnStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], Extrapolate.CLAMP);
    return { transform: [{ scale }] };
  });

  return (
    <View style={{ width: width, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[styles.cardContainer, rnStyle]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => { Haptics.selectionAsync(); onPress(item); }}>
          <LinearGradient colors={['#1F1F1F', '#000000']} style={styles.cardGradient}>
            <View style={{position:'absolute', top:0, left:0, right:0, height:1, backgroundColor: THEME.gold}} />
            <View style={styles.row}>
                <Text style={styles.bank}>{item.bankName.toUpperCase()}</Text>
                <ShieldCheck color={THEME.gold} size={24} />
            </View>
            <View style={{flexDirection:'row', alignItems:'center', marginTop:20}}>
                <View style={styles.chip} />
                <Zap color="#444" size={20} style={{marginLeft:10}} />
            </View>
            <Text style={styles.number}>{item.number.replace(/(.{4})/g, '$1  ').trim()}</Text>
            <View style={styles.row}>
                <View><Text style={styles.label}>HOLDER</Text><Text style={styles.val}>{item.name.toUpperCase()}</Text></View>
                <View><Text style={styles.label}>EXPIRY</Text><Text style={styles.val}>{item.expiry}</Text></View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function App() {
  const [cards, setCards] = useState([]);
  const [view, setView] = useState('HOME');
  const [active, setActive] = useState(null);
  const [amt, setAmt] = useState('');
  const scrollX = useSharedValue(0);

  useEffect(() => {
    SecureStore.getItemAsync('cards').then(c => { if(c) setCards(JSON.parse(c)); });
  }, []);

  const save = (data) => {
    const n = [...cards, {...data, id: Date.now().toString()}];
    setCards(n);
    SecureStore.setItemAsync('cards', JSON.stringify(n));
    setView('HOME');
  };

  const handleReq = (r) => {
      if(r.url.startsWith('upi:') || r.url.startsWith('phonepe:') || r.url.startsWith('gpay:')) {
          Linking.openURL(r.url);
          return false;
      }
      return true;
  };

  if(view === 'PAY') {
      return (
          <SafeAreaView style={{flex:1, backgroundColor:'black'}}>
              <StatusBar barStyle="light-content" />
              <View style={styles.nav}><TouchableOpacity onPress={()=>setView('HOME')}><X color="white"/></TouchableOpacity><Text style={{color:THEME.gold}}>SECURE PAY</Text><View/></View>
              <WebView source={{uri: BANK_URL}} injectedJavaScript={getGhostScript(active, amt, active.email, active.phone)} onShouldStartLoadWithRequest={handleReq} javaScriptEnabled domStorageEnabled />
          </SafeAreaView>
      );
  }

  return (
    <View style={styles.main}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#111', 'black']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{flex:1}}>
            <View style={styles.header}>
                <Text style={styles.title}>ELITE</Text>
                <TouchableOpacity onPress={()=>setView('ADD')} style={styles.add}><Plus color="black"/></TouchableOpacity>
            </View>
            <View style={{height: CARD_HEIGHT+20}}>
                <Animated.FlatList 
                    data={cards} horizontal showsHorizontalScrollIndicator={false} snapToInterval={width} decelerationRate="fast"
                    onScroll={e=>scrollX.value=e.nativeEvent.contentOffset.x}
                    renderItem={({item, index}) => <LuxuryCard item={item} index={index} scrollX={scrollX} onPress={c=>{setActive(c); Alert.prompt("Amount", "", t=>{if(t){setAmt(t); setView('PAY')}}, "plain-text", "", "number-pad")}} />}
                    ListEmptyComponent={<Text style={{color:'#444', textAlign:'center', marginTop:50}}>NO CARDS</Text>}
                />
            </View>
        </SafeAreaView>
        
        <Modal visible={view === 'ADD'} transparent animationType="slide">
            <View style={styles.modal}>
                <BlurView intensity={30} style={StyleSheet.absoluteFill} />
                <View style={styles.form}>
                    <Text style={{color:'white', fontSize:20, fontWeight:'bold', marginBottom:20}}>ADD CARD</Text>
                    <AddCardForm onSave={save} onCancel={()=>setView('HOME')} />
                </View>
            </View>
        </Modal>
    </View>
  );
}

const AddCardForm = ({onSave, onCancel}) => {
    const [f, s] = useState({bankName:'Axis', number:'', name:'', expiry:'', email:'', phone:''});
    return (
        <View>
            {Object.keys(f).map(k => <TextInput key={k} style={styles.input} placeholder={k.toUpperCase()} placeholderTextColor="#555" onChangeText={t=>s({...f, [k]:t})} keyboardType={k==='number' || k==='phone' ? 'number-pad' : 'default'} maxLength={k==='number'?16:50}/>)}
            <TouchableOpacity style={styles.btn} onPress={()=>onSave(f)}><Text style={{fontWeight:'bold'}}>SAVE</Text></TouchableOpacity>
            <TouchableOpacity style={{alignItems:'center', marginTop:15}} onPress={onCancel}><Text style={{color:'#666'}}>CANCEL</Text></TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    main: {flex:1, backgroundColor:'black'},
    header: {padding:20, flexDirection:'row', justifyContent:'space-between', alignItems:'center'},
    title: {fontSize:30, fontWeight:'900', color:'white', letterSpacing:5},
    add: {width:40, height:40, borderRadius:20, backgroundColor:THEME.gold, justifyContent:'center', alignItems:'center'},
    cardContainer: {width: CARD_WIDTH, height: CARD_HEIGHT},
    cardGradient: {flex:1, borderRadius:20, padding:20, justifyContent:'space-between', borderWidth:1, borderColor:'#222'},
    row: {flexDirection:'row', justifyContent:'space-between', alignItems:'center'},
    bank: {color:'white', fontSize:18, fontWeight:'bold', letterSpacing:2},
    chip: {width:40, height:30, backgroundColor: THEME.gold, borderRadius:5, opacity:0.8},
    number: {color:'white', fontSize:22, fontFamily: Platform.OS==='ios'?'Courier':'monospace', letterSpacing:3},
    label: {color:'#666', fontSize:10, fontWeight:'bold'},
    val: {color:'white', fontSize:14, fontWeight:'bold'},
    modal: {flex:1, justifyContent:'flex-end'},
    form: {backgroundColor:'#111', padding:30, borderTopLeftRadius:30, borderTopRightRadius:30},
    input: {backgroundColor:'#222', padding:15, borderRadius:10, color:'white', marginBottom:10},
    btn: {backgroundColor:THEME.gold, padding:15, borderRadius:10, alignItems:'center', marginTop:10},
    nav: {padding:15, flexDirection:'row', justifyContent:'space-between', backgroundColor:'#111', alignItems:'center'}
});


                      
