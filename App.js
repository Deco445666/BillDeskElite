import React, { useState, useEffect } from 'react';

// --- PRIMITIVE MOCKS (React Native -> HTML/CSS) ---
// This section replaces the need for 'react-native' or 'react-native-web'
// by implementing lightweight versions of the components using standard HTML.

const Platform = { OS: 'web' };

const flattenStyle = (style) => {
  if (!style) return {};
  if (Array.isArray(style)) return style.reduce((acc, s) => ({ ...acc, ...flattenStyle(s) }), {});
  return style;
};

// Helper to map RN-specific styles to CSS
const mapStyles = (style) => {
  const s = flattenStyle(style);
  const css = { ...s };
  if (css.paddingHorizontal !== undefined) { css.paddingLeft = css.paddingHorizontal; css.paddingRight = css.paddingHorizontal; delete css.paddingHorizontal; }
  if (css.paddingVertical !== undefined) { css.paddingTop = css.paddingVertical; css.paddingBottom = css.paddingVertical; delete css.paddingVertical; }
  if (css.marginHorizontal !== undefined) { css.marginLeft = css.marginHorizontal; css.marginRight = css.marginHorizontal; delete css.marginHorizontal; }
  if (css.marginVertical !== undefined) { css.marginTop = css.marginVertical; css.marginBottom = css.marginVertical; delete css.marginVertical; }
  return css;
};

const View = ({ style, children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', boxSizing: 'border-box', borderStyle: 'solid', borderWidth: 0, ...mapStyles(style) }} {...props}>
    {children}
  </div>
);

const Text = ({ style, children, ...props }) => (
  <span style={{ display: 'inline-block', fontFamily: 'system-ui, -apple-system, sans-serif', whiteSpace: 'pre-wrap', ...mapStyles(style) }} {...props}>
    {children}
  </span>
);

const TouchableOpacity = ({ style, children, onPress, activeOpacity, ...props }) => (
  <div 
    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', ...mapStyles(style) }} 
    onClick={onPress}
    {...props}
  >
    {children}
  </div>
);

const TextInput = ({ style, placeholderTextColor, ...props }) => (
  <input 
    style={{ outline: 'none', border: 'none', ...mapStyles(style) }} 
    {...props} 
  />
);

const SafeAreaView = View;
const StatusBar = () => null;
const ActivityIndicator = ({ color }) => <div style={{ color }}>Loading...</div>;

const FlatList = ({ data, renderItem, horizontal, ListEmptyComponent, ...props }) => (
  <div style={{ display: 'flex', flexDirection: horizontal ? 'row' : 'column', overflow: 'auto', ...mapStyles(props.style) }}>
    {(!data || data.length === 0) ? ListEmptyComponent : data.map((item, index) => (
      <React.Fragment key={item.id || index}>
        {renderItem({ item, index })}
      </React.Fragment>
    ))}
  </div>
);

const Modal = ({ visible, children, transparent }) => {
  if (!visible) return null;
  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      zIndex: 1000, display: 'flex', flexDirection: 'column',
      pointerEvents: 'auto'
    }}>
      {children}
    </div>
  );
};

const Dimensions = {
  get: () => ({ width: 375, height: 812 }) // Fixed simulation size
};

const StyleSheet = {
  create: (styles) => styles,
  absoluteFill: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }
};

const Alert = {
  prompt: (title, msg, buttons, type, def, keyboard) => {
    const val = window.prompt(title + '\n' + msg, def);
    if (val !== null) {
      const confirmBtn = buttons.find(b => b.text !== 'Cancel');
      if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress(val);
    }
  }
};

const Linking = {
  openURL: (url) => {
    console.log('Linking.openURL:', url);
    window.alert(`Opening URL: ${url}`);
  }
};

// --- MODULE MOCKS ---

const SecureStore = {
  getItemAsync: async (key) => { console.log('SecureStore.get', key); return null; },
  setItemAsync: async (key, value) => console.log('SecureStore.set', key, value)
};

const Haptics = {
  selectionAsync: async () => {},
  impactAsync: async () => {}
};

const BlurView = ({ style, intensity, children }) => (
  <div style={{ ...mapStyles(style), backgroundColor: `rgba(0,0,0,${(intensity || 50)/100})`, backdropFilter: `blur(${intensity/5}px)` }}>
    {children}
  </div>
);

const IconMock = ({ color, size, style }) => (
  <div style={{ 
    width: size, height: size, backgroundColor: color, borderRadius: size/4, 
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'black',
    ...mapStyles(style)
  }} />
);
const CreditCard = IconMock;
const Plus = IconMock;
const X = IconMock;
const ShieldCheck = IconMock;
const Zap = IconMock;
const History = IconMock;

const WebView = ({ source }) => (
  <div style={{ flex: 1, backgroundColor: '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    WebView Mock: {source.uri}
  </div>
);

const Animated = {
  View: View,
  FlatList: FlatList,
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: () => ({})
};
const useSharedValue = (v) => ({ value: v });
const useAnimatedStyle = () => ({});
const interpolate = () => 0;
const Extrapolate = { CLAMP: 'clamp' };


// --- APP LOGIC ---

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = 230;
const AXIS_URL = 'https://pgi.billdesk.com/pgidsk/pgmerc/axiscard/axis_card.jsp';

const THEME = {
  bg: '#000000',
  gold: '#D4AF37',
  surface: '#121212',
  text: '#FFFFFF',
  dim: '#666666'
};

const LuxuryCard = ({ item, index, scrollX, onPress }) => {
  return (
    <div style={{ width: width, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => { Haptics.selectionAsync(); onPress(item); }}>
        <View style={{...styles.cardContainer, ...styles.cardGradient}}>
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
        </View>
      </TouchableOpacity>
    </div>
  );
};

export default function App() {
  const [cards, setCards] = useState([]);
  const [view, setView] = useState('HOME');
  const [active, setActive] = useState(null);
  const [amt, setAmt] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState('');
  
  useEffect(() => {
    // Initial mock data for preview
    setCards([
        { id: '1', bankName: 'Axis Bank', number: '4598123456789012', name: 'User Name', expiry: '12/25', email: 'a@b.com', phone: '123' },
        { id: '2', bankName: 'HDFC Bank', number: '5598123456789012', name: 'JANE DOE', expiry: '11/24', email: 'jane@example.com', phone: '9876543210' }
    ]);
  }, []);

  const save = (data) => {
    const n = [...cards, {...data, id: Date.now().toString()}];
    setCards(n);
    SecureStore.setItemAsync('cards', JSON.stringify(n));
    setView('HOME');
  };

  const getGeminiInsights = async () => {
    setGeminiLoading(true);
    setGeminiResponse('');
    setView('GEMINI'); // Open the modal

    const apiKey = ""; // API key provided by environment
    const prompt = `
      Act as a high-end financial advisor. Analyze the following credit card portfolio and provide 3 brief, strategic insights for optimizing credit usage, maximizing rewards, or managing payments.
      
      User Portfolio:
      ${JSON.stringify(cards.map(c => ({ bank: c.bankName, expiry: c.expiry })))}
      
      Keep the tone professional, luxurious, and concise (bullet points).
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate insights at this moment.";
      setGeminiResponse(text);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setGeminiResponse("Connection error. Please try again.");
    } finally {
      setGeminiLoading(false);
    }
  };

  if(view === 'PAY') {
      return (
          <SafeAreaView style={{flex:1, backgroundColor:'black', minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
              <StatusBar barStyle="light-content" />
              <View style={styles.nav}>
                  <TouchableOpacity onPress={()=>setView('HOME')}><X color="white" size={24}/></TouchableOpacity>
                  <Text style={{color:THEME.gold}}>SECURE PAY</Text>
                  <View style={{width:24}}/>
              </View>
              <WebView source={{uri: AXIS_URL}} />
          </SafeAreaView>
      );
  }

  return (
    <View style={styles.main}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={{flex:1, display: 'flex', flexDirection: 'column'}}>
            <View style={styles.header}>
                <Text style={styles.title}>ELITE</Text>
                <TouchableOpacity onPress={()=>setView('ADD')} style={styles.add}><Plus color="black" size={24}/></TouchableOpacity>
            </View>
            <View style={{height: CARD_HEIGHT+20, width: '100%'}}>
                <FlatList 
                    data={cards} horizontal showsHorizontalScrollIndicator={false}
                    renderItem={({item, index}) => <LuxuryCard item={item} index={index} scrollX={0} onPress={c=>{setActive(c); Alert.prompt("Amount", "", [{text:'Cancel'},{text:'OK', onPress: t=>{if(t){setAmt(t); setView('PAY')}}}], "plain-text", "100");}} />}
                    ListEmptyComponent={<Text style={{color:'#444', textAlign:'center', marginTop:50, width: '100%'}}>NO CARDS</Text>}
                />
            </View>

            {/* Gemini Insight Button */}
            <View style={{padding: 20, alignItems: 'center'}}>
                <TouchableOpacity 
                    style={styles.geminiButton} 
                    onPress={getGeminiInsights}
                >
                    <Text style={styles.geminiButtonText}>✨ GET FINANCIAL INSIGHTS</Text>
                </TouchableOpacity>
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

        <Modal visible={view === 'GEMINI'} transparent animationType="slide">
            <View style={styles.modal}>
                <BlurView intensity={40} style={StyleSheet.absoluteFill} />
                <View style={styles.form}>
                    <Text style={{color:THEME.gold, fontSize:22, fontWeight:'900', marginBottom:10, letterSpacing: 1}}>ELITE ADVISOR ✨</Text>
                    <View style={{minHeight: 100, justifyContent: 'center'}}>
                        {geminiLoading ? (
                            <ActivityIndicator color={THEME.gold} />
                        ) : (
                            <Text style={{color:'white', lineHeight: '1.5em', fontSize: 14}}>{geminiResponse}</Text>
                        )}
                    </View>
                    <TouchableOpacity style={{alignItems:'center', marginTop:20, padding: 10, backgroundColor: '#333', borderRadius: 10}} onPress={()=>setView('HOME')}>
                        <Text style={{color:'white', fontWeight: 'bold'}}>CLOSE</Text>
                    </TouchableOpacity>
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
            {Object.keys(f).map(k => (
                <TextInput 
                    key={k} 
                    style={styles.input} 
                    placeholder={k.toUpperCase()} 
                    placeholderTextColor="#555" 
                    onChange={(e) => s({...f, [k]:e.target.value})} 
                />
            ))}
            <TouchableOpacity style={styles.btn} onPress={()=>onSave(f)}><Text style={{fontWeight:'bold'}}>SAVE</Text></TouchableOpacity>
            <TouchableOpacity style={{alignItems:'center', marginTop:15}} onPress={onCancel}><Text style={{color:'#666'}}>CANCEL</Text></TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    main: {flex:1, backgroundColor:'black', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'},
    header: {padding:20, flexDirection:'row', justifyContent:'space-between', alignItems:'center'},
    title: {fontSize:30, fontWeight:'900', color:'white', letterSpacing:5},
    add: {width:40, height:40, borderRadius:20, backgroundColor:THEME.gold, justifyContent:'center', alignItems:'center', cursor: 'pointer'},
    cardContainer: {width: CARD_WIDTH, height: CARD_HEIGHT},
    cardGradient: {flex:1, borderRadius:20, padding:20, justifyContent:'space-between', borderWidth:1, borderColor:'#222', backgroundColor: '#111', display: 'flex', flexDirection: 'column'},
    row: {flexDirection:'row', justifyContent:'space-between', alignItems:'center'},
    bank: {color:'white', fontSize:18, fontWeight:'bold', letterSpacing:2},
    chip: {width:40, height:30, backgroundColor: THEME.gold, borderRadius:5, opacity:0.8},
    number: {color:'white', fontSize:22, fontFamily: 'monospace', letterSpacing:3},
    label: {color:'#666', fontSize:10, fontWeight:'bold'},
    val: {color:'white', fontSize:14, fontWeight:'bold'},
    modal: {flex:1, justifyContent:'flex-end', display: 'flex', flexDirection: 'column'},
    form: {backgroundColor:'#111', padding:30, borderTopLeftRadius:30, borderTopRightRadius:30, border: '1px solid #333'},
    input: {backgroundColor:'#222', padding:15, borderRadius:10, color:'white', marginBottom:10, width: '100%', boxSizing: 'border-box'},
    btn: {backgroundColor:THEME.gold, padding:15, borderRadius:10, alignItems:'center', marginTop:10, cursor: 'pointer'},
    nav: {padding:15, flexDirection:'row', justifyContent:'space-between', backgroundColor:'#111', alignItems:'center'},
    geminiButton: {
        backgroundColor: '#1a1a1a',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: THEME.gold,
        shadowColor: THEME.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    geminiButtonText: {
        color: THEME.gold,
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1
    }
});
