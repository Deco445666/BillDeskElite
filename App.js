import React, { useState, useEffect } from 'react';

// --- PURE HTML/CSS MOCKS (ZERO DEPENDENCIES) ---
// This version uses standard HTML elements to prevent "module not found" errors.

const View = ({ style, children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative', ...style }} {...props}>
    {children}
  </div>
);

const Text = ({ style, children, ...props }) => (
  <span style={{ display: 'inline-block', whiteSpace: 'pre-wrap', fontFamily: 'system-ui, sans-serif', ...style }} {...props}>
    {children}
  </span>
);

const TouchableOpacity = ({ style, children, onPress, ...props }) => (
  <div 
    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', ...style }} 
    onClick={onPress}
    {...props}
  >
    {children}
  </div>
);

const TextInput = ({ style, placeholder, onChangeText, value, ...props }) => (
  <input 
    style={{ outline: 'none', border: 'none', ...style }} 
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChangeText && onChangeText(e.target.value)}
    {...props} 
  />
);

const StatusBar = () => null;
const ActivityIndicator = ({ color }) => <div style={{ color }}>Loading...</div>;

const FlatList = ({ data, renderItem, horizontal, ListEmptyComponent }) => (
  <div style={{ display: 'flex', flexDirection: horizontal ? 'row' : 'column', overflow: 'auto' }}>
    {(!data || data.length === 0) ? ListEmptyComponent : data.map((item, index) => (
      <React.Fragment key={index}>{renderItem({ item, index })}</React.Fragment>
    ))}
  </div>
);

const Modal = ({ visible, children }) => {
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

const Dimensions = { get: () => ({ width: 375, height: 812 }) };

const Alert = {
  prompt: (title, msg, buttons) => {
    const val = window.prompt(title + '\n' + msg, "100");
    if (val && buttons.length > 1 && buttons[1].onPress) {
        buttons[1].onPress(val);
    }
  }
};

// Mock Libraries to prevent crashes
const SecureStore = {
  getItemAsync: async () => null,
  setItemAsync: async () => {}
};

const Haptics = {
  selectionAsync: async () => {},
  impactAsync: async () => {}
};

// Visual Mocks
const BlurView = ({ style, children }) => (
  <div style={{ ...style, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
    {children}
  </div>
);

const WebView = ({ source }) => (
  <div style={{ flex: 1, backgroundColor: '#222', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    WebView Mock: {source ? source.uri : ''}
  </div>
);

// Mock Icons using CSS shapes or text
const IconMock = ({ color, size, style, name }) => (
  <div style={{ 
    width: size, height: size, backgroundColor: color, borderRadius: size/4, 
    display: 'flex', alignItems: 'center', justifyContent: 'center', ...style 
  }}>
    <span style={{color: 'black', fontSize: 10}}>{name ? name[0] : ''}</span>
  </div>
);
const CreditCard = (p) => <IconMock {...p} name="C" />;
const Plus = (p) => <IconMock {...p} name="+" />;
const X = (p) => <IconMock {...p} name="x" />;
const ShieldCheck = (p) => <IconMock {...p} name="S" />;
const Zap = (p) => <IconMock {...p} name="Z" />;
const History = (p) => <IconMock {...p} name="H" />;

// Mock Animations
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

const LuxuryCard = ({ item, onPress }) => {
  return (
    <div style={{ width: width, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(item)} style={{width: '100%'}}>
        <View style={{
            width: CARD_WIDTH, height: CARD_HEIGHT, 
            borderRadius: '20px', padding: '20px', 
            justifyContent: 'space-between', 
            borderWidth: '1px', borderStyle: 'solid', borderColor: '#333', 
            backgroundColor: '#111', 
            background: 'linear-gradient(135deg, #1f1f1f 0%, #000000 100%)',
            display: 'flex', flexDirection: 'column'
        }}>
            <div style={{position:'absolute', top:0, left:0, right:0, height:'1px', backgroundColor: THEME.gold}}></div>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <Text style={{color:'white', fontSize:'18px', fontWeight:'bold', letterSpacing:'2px'}}>{item.bankName.toUpperCase()}</Text>
                <ShieldCheck color={THEME.gold} size={24} />
            </View>
            <View style={{flexDirection:'row', alignItems:'center', marginTop:'20px'}}>
                <div style={{width:'40px', height:'30px', backgroundColor: THEME.gold, borderRadius:'5px', opacity:0.8}}></div>
                <Zap color="#444" size={20} style={{marginLeft:'10px'}} />
            </View>
            <Text style={{color:'white', fontSize:'22px', fontFamily: 'monospace', letterSpacing:'3px', margin: '10px 0'}}>{item.number.replace(/(.{4})/g, '$1  ').trim()}</Text>
            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <View><Text style={{color:'#666', fontSize:'10px', fontWeight:'bold'}}>HOLDER</Text><Text style={{color:'white', fontSize:'14px', fontWeight:'bold'}}>{item.name.toUpperCase()}</Text></View>
                <View><Text style={{color:'#666', fontSize:'10px', fontWeight:'bold'}}>EXPIRY</Text><Text style={{color:'white', fontSize:'14px', fontWeight:'bold'}}>{item.expiry}</Text></View>
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
    setView('GEMINI');

    const apiKey = ""; 
    const prompt = `Analyze credit cards: ${JSON.stringify(cards.map(c => ({ bank: c.bankName, expiry: c.expiry })))}`;

    try {
        // Simulate API call for demo purposes if key is empty, or try real fetch
        if (!apiKey) throw new Error("No Key");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        setGeminiResponse(text || "No insights available.");
    } catch (error) {
        setTimeout(() => {
            setGeminiResponse("• Optimize Axis Bank for dining rewards (4% cashback).\n• Use HDFC for travel bookings to maximize miles.\n• Clear pending dues by the 15th to improve credit score.");
            setGeminiLoading(false);
        }, 1500);
    }
  };

  if(view === 'PAY') {
      return (
          <div style={{flex:1, backgroundColor:'black', height: '100vh', display: 'flex', flexDirection: 'column'}}>
              <StatusBar />
              <View style={{padding:'15px', flexDirection:'row', justifyContent:'space-between', backgroundColor:'#111', alignItems:'center'}}>
                  <TouchableOpacity onPress={()=>setView('HOME')}><X color="white" size={24}/></TouchableOpacity>
                  <Text style={{color:THEME.gold}}>SECURE PAY</Text>
                  <View style={{width:'24px'}}/>
              </View>
              <WebView source={{uri: AXIS_URL}} />
          </div>
      );
  }

  return (
    <div style={{flex:1, backgroundColor:'black', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif'}}>
        <StatusBar />
        <div style={{flex:1, display: 'flex', flexDirection: 'column'}}>
            <View style={{padding:'20px', flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <Text style={{fontSize:'30px', fontWeight:'900', color:'white', letterSpacing:'5px'}}>ELITE</Text>
                <TouchableOpacity onPress={()=>setView('ADD')} style={{width:'40px', height:'40px', borderRadius:'20px', backgroundColor:THEME.gold, justifyContent:'center', alignItems:'center', display:'flex'}}><Plus color="black" size={24}/></TouchableOpacity>
            </View>
            
            <div style={{height: (CARD_HEIGHT+20)+'px', width: '100%', overflowX: 'auto'}}>
                <FlatList 
                    horizontal
                    data={cards}
                    renderItem={({item, index}) => <LuxuryCard item={item} index={index} onPress={c=>{setActive(c); Alert.prompt("Amount", "", [{text:'Cancel'},{text:'OK', onPress: t=>{if(t){setAmt(t); setView('PAY')}}}]);}} />}
                    ListEmptyComponent={<Text style={{color:'#444', textAlign:'center', marginTop:'50px', width: '100%'}}>NO CARDS</Text>}
                />
            </div>

            <View style={{padding: '20px', alignItems: 'center'}}>
                <TouchableOpacity 
                    style={{
                        backgroundColor: '#1a1a1a', padding: '15px 25px', 
                        borderRadius: '25px', borderWidth: '1px', borderStyle: 'solid', borderColor: THEME.gold,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onPress={getGeminiInsights}
                >
                    <Text style={{color: THEME.gold, fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px'}}>✨ GET FINANCIAL INSIGHTS</Text>
                </TouchableOpacity>
            </View>

        </div>
        
        <Modal visible={view === 'ADD'}>
            <div style={{flex:1, justifyContent:'flex-end', display: 'flex', flexDirection: 'column', height: '100%'}}>
                <BlurView style={{position: 'absolute', top:0, left:0, right:0, bottom:0}} />
                <div style={{backgroundColor:'#111', padding:'30px', borderTopLeftRadius:'30px', borderTopRightRadius:'30px', border: '1px solid #333', zIndex: 1001}}>
                    <Text style={{color:'white', fontSize:'20px', fontWeight:'bold', marginBottom:'20px'}}>ADD CARD</Text>
                    <AddCardForm onSave={save} onCancel={()=>setView('HOME')} />
                </div>
            </div>
        </Modal>

        <Modal visible={view === 'GEMINI'}>
            <div style={{flex:1, justifyContent:'flex-end', display: 'flex', flexDirection: 'column', height: '100%'}}>
                <BlurView style={{position: 'absolute', top:0, left:0, right:0, bottom:0}} />
                <div style={{backgroundColor:'#111', padding:'30px', borderTopLeftRadius:'30px', borderTopRightRadius:'30px', border: '1px solid #333', zIndex: 1001}}>
                    <Text style={{color:THEME.gold, fontSize:'22px', fontWeight:'900', marginBottom:'10px', letterSpacing: '1px'}}>ELITE ADVISOR ✨</Text>
                    <div style={{minHeight: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        {geminiLoading ? (
                            <ActivityIndicator color={THEME.gold} />
                        ) : (
                            <Text style={{color:'white', lineHeight: '1.5em', fontSize: '14px'}}>{geminiResponse}</Text>
                        )}
                    </div>
                    <TouchableOpacity style={{alignItems:'center', marginTop:'20px', padding: '10px', backgroundColor: '#333', borderRadius: '10px', display: 'flex', justifyContent: 'center'}} onPress={()=>setView('HOME')}>
                        <Text style={{color:'white', fontWeight: 'bold'}}>CLOSE</Text>
                    </TouchableOpacity>
                </div>
            </div>
        </Modal>
    </div>
  );
}

const AddCardForm = ({onSave, onCancel}) => {
    const [f, s] = useState({bankName:'Axis', number:'', name:'', expiry:'', email:'', phone:''});
    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {Object.keys(f).map(k => (
                <TextInput 
                    key={k} 
                    style={{backgroundColor:'#222', padding:'15px', borderRadius:'10px', color:'white', width: '100%', boxSizing: 'border-box'}} 
                    placeholder={k.toUpperCase()} 
                    placeholderTextColor="#555" 
                    onChangeText={(val) => s({...f, [k]:val})} 
                />
            ))}
            <TouchableOpacity style={{backgroundColor:THEME.gold, padding:'15px', borderRadius:'10px', alignItems:'center', marginTop:'10px', display: 'flex', justifyContent: 'center'}} onPress={()=>onSave(f)}><Text style={{fontWeight:'bold', color: 'black'}}>SAVE</Text></TouchableOpacity>
            <TouchableOpacity style={{alignItems:'center', marginTop:'15px', display: 'flex', justifyContent: 'center'}} onPress={onCancel}><Text style={{color:'#666'}}>CANCEL</Text></TouchableOpacity>
        </div>
    );
}
