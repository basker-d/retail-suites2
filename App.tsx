
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AnimationOption, GeneratedVideo, AspectRatio, User } from './types';
import { ANIMATION_OPTIONS, LOADING_MESSAGES } from './constants';
import { generateVideoAd, fileToBase64, getMimeType } from './services/geminiService';
import { loginUser, registerUser } from './services/apiService';
import { Header } from './components/Header';
import { ShinyButton } from './components/ShinyButton';
import { Loader } from './components/Loader';
import { UploadIcon, CameraIcon, DownloadIcon, FacebookIcon, TwitterIcon, InstagramIcon, CopyIcon, ShareIcon, GoogleIcon, AppleIcon } from './components/icons';

const ApiKeyScreen: React.FC<{ onSelectKey: () => void }> = ({ onSelectKey }) => (
    <div className="text-center p-8 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-dpa-purple/50 shadow-lg max-w-lg">
        <h2 className="text-2xl font-bold mb-4">API Key Required</h2>
        <p className="mb-4 text-gray-300">To generate videos with Veo, Google's most advanced video model, you need to select a project API key.</p>
        <p className="text-sm text-gray-400 mb-6">This is a security measure and ensures that usage is correctly billed to your project.</p>
        <p className="mb-6 text-sm text-gray-400">
            For more information on billing, please visit the{' '}
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
                official documentation
            </a>.
        </p>
        <ShinyButton onClick={onSelectKey} color="blue">
            Select API Key
        </ShinyButton>
    </div>
);

const AuthScreen: React.FC<{ 
    isLogin: boolean, 
    setAppState: (state: AppState) => void, 
    onAuthSuccess: (token: string, user: User) => void,
    setError: (error: string | null) => void,
    showNotification: (message: string) => void
}> = ({ isLogin, setAppState, onAuthSuccess, setError, showNotification }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const title = isLogin ? "Welcome Back!" : "Create an Account";
    const subtitle = isLogin ? "Log in to continue." : "Sign up to get started.";
    const buttonText = isLogin ? "Log In" : "Sign Up";
    const switchText = isLogin ? "Don't have an account?" : "Already have an account?";
    const switchLinkText = isLogin ? "Sign Up" : "Log In";
    const switchToState = isLogin ? AppState.SIGNUP : AppState.LOGIN;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const authFunction = isLogin ? loginUser : registerUser;
            const { token, user } = await authFunction(email, password);
            onAuthSuccess(token, user);
        } catch (err: any) {
            setError(err.message || 'An authentication error occurred. Please ensure the backend server is running.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = () => {
        showNotification("Social login coming soon!");
    }

    return (
        <div className="w-full max-w-md text-center p-8 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-dpa-purple/50 shadow-lg">
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="mb-6 text-gray-300">{subtitle}</p>

            <div className="space-y-3">
                <button onClick={handleSocialLogin} className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                    <GoogleIcon className="w-5 h-5" />
                    Continue with Google
                </button>
                 <button onClick={handleSocialLogin} className="w-full flex items-center justify-center gap-3 bg-black text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors border border-gray-600">
                    <AppleIcon className="w-5 h-5" />
                    Continue with Apple
                </button>
            </div>

            <div className="my-6 flex items-center gap-4">
                <hr className="w-full border-gray-600"/>
                <span className="text-gray-400 text-sm">OR</span>
                <hr className="w-full border-gray-600"/>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue" />
                </div>
                <div>
                    <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue" />
                </div>
                <ShinyButton type="submit" color="blue" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Processing...' : buttonText}
                </ShinyButton>
            </form>
            <p className="mt-6 text-sm text-gray-400">
                {switchText}{' '}
                <button onClick={() => setAppState(switchToState)} className="font-semibold text-accent-orange hover:underline">
                    {switchLinkText}
                </button>
            </p>
        </div>
    );
}

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
    const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
    const [uploadedImageB64, setUploadedImageB64] = useState<string | null>(null);
    const [selectedAnimation, setSelectedAnimation] = useState<AnimationOption | null>(null);
    const [selectedAddOn, setSelectedAddOn] = useState<AnimationOption | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Check for stored token on initial load
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            setToken(storedToken);
            const storedUser = localStorage.getItem('user');
            if(storedUser) setUser(JSON.parse(storedUser));
            setAppState(AppState.API_KEY_CHECK);
        }
    }, []);

    const isLoggedIn = !!token;

    const checkApiKey = useCallback(async () => {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
            setAppState(AppState.UPLOAD);
        } else {
            setAppState(AppState.API_KEY_CHECK);
        }
    }, []);
    
    useEffect(() => {
        if (isLoggedIn && appState === AppState.API_KEY_CHECK) {
            checkApiKey();
        }
    }, [isLoggedIn, appState, checkApiKey]);
    
    const handleAuthSuccess = (newToken: string, newUser: User) => {
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setAppState(AppState.API_KEY_CHECK);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setGeneratedVideos([]); // Clear videos on logout
        setAppState(AppState.LOGIN);
    };

    const handleSelectApiKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            setAppState(AppState.UPLOAD);
        } catch (e) {
            console.error("Error opening API key selection:", e);
            setError("Could not open API key selection dialog.");
        }
    };
    
    useEffect(() => {
        if (appState !== AppState.GENERATING) return;
        let messageIndex = 0;
        const interval = setInterval(() => {
            messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
            setLoadingMessage(LOADING_MESSAGES[messageIndex]);
        }, 3000);
        return () => clearInterval(interval);
    }, [appState]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const b64 = await fileToBase64(file);
                setUploadedImageFile(file);
                setUploadedImageB64(b64);
                setAppState(AppState.SELECT_ANIMATION);
                setError(null);
            } catch (err) {
                setError("Could not process the image file.");
            }
        }
    };

    const handleCreateAd = async () => {
        if (!uploadedImageFile || !uploadedImageB64 || !selectedAnimation) return;
        setAppState(AppState.GENERATING);
        setError(null);
        setLoadingMessage(LOADING_MESSAGES[0]);

        let finalPrompt = selectedAnimation.prompt;
        if (selectedAddOn) {
            finalPrompt += ` Additionally, the following effect should be applied: ${selectedAddOn.description.toLowerCase()}`;
        }

        try {
            const mimeType = getMimeType(uploadedImageFile);
            const videoUrl = await generateVideoAd(uploadedImageB64, mimeType, finalPrompt, aspectRatio);
            const newVideo: GeneratedVideo = { id: new Date().toISOString(), src: videoUrl, prompt: finalPrompt };
            setGeneratedVideos(prev => [newVideo, ...prev]);
            // In a real app, you would also send this video to your backend to associate it with the logged-in user
            setCurrentVideoUrl(videoUrl);
            setAppState(AppState.VIEW_VIDEO);
        } catch (err: any) {
            let errorMessage = err.message || "An unknown error occurred during video generation.";
            if (errorMessage.includes("Requested entity was not found")) {
                errorMessage = "API Key not found or invalid. Please select your key again.";
                setAppState(AppState.API_KEY_CHECK);
            } else {
                 setAppState(AppState.SELECT_ANIMATION);
            }
            setError(errorMessage);
        }
    };

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleShare = async () => {
        if (navigator.share && currentVideoUrl) {
            try {
                const response = await fetch(currentVideoUrl);
                const blob = await response.blob();
                const file = new File([blob], `dp-artifact-ad.mp4`, { type: 'video/mp4' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                     await navigator.share({
                        title: 'Check out my AI-generated ad!',
                        text: 'Created with DP Artifacts AI Ad Generator.',
                        files: [file],
                    });
                } else {
                     await navigator.share({
                        title: 'Check out my AI-generated ad!',
                        url: window.location.href,
                    });
                }
            } catch (error) {
                console.error('Error sharing:', error);
                setError("Could not share the video.");
            }
        } else {
            showNotification('Web Share API is not supported in your browser. Try copying the link.');
        }
    };
    
    const handleCopyLink = () => {
        if (currentVideoUrl) {
           showNotification("Please download the video to share the file.");
        }
    };

    const resetToUpload = () => {
        setUploadedImageFile(null);
        setUploadedImageB64(null);
        setSelectedAnimation(null);
        setSelectedAddOn(null);
        setCurrentVideoUrl(null);
        setError(null);
        setAppState(AppState.UPLOAD);
    };

    const renderContent = () => {
        if (!isLoggedIn) {
             switch(appState) {
                case AppState.LOGIN:
                    return <AuthScreen isLogin={true} setAppState={setAppState} onAuthSuccess={handleAuthSuccess} setError={setError} showNotification={showNotification} />
                case AppState.SIGNUP:
                     return <AuthScreen isLogin={false} setAppState={setAppState} onAuthSuccess={handleAuthSuccess} setError={setError} showNotification={showNotification}/>
                default:
                     return <AuthScreen isLogin={true} setAppState={setAppState} onAuthSuccess={handleAuthSuccess} setError={setError} showNotification={showNotification} />
             }
        }

        switch (appState) {
            case AppState.API_KEY_CHECK:
                return <ApiKeyScreen onSelectKey={handleSelectApiKey} />;

            case AppState.UPLOAD:
                return (
                    <div className="w-full max-w-2xl text-center p-8 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-dpa-purple/50 shadow-lg">
                        <h2 className="text-2xl font-bold mb-2">Create a Video Ad</h2>
                        <p className="mb-8 text-gray-300">Start by providing an image of your product.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <ShinyButton color="blue" onClick={() => fileInputRef.current?.click()}>
                                <UploadIcon className="w-5 h-5 mr-2" /> Upload from Device
                            </ShinyButton>
                            <ShinyButton color="orange" disabled>
                                <CameraIcon className="w-5 h-5 mr-2" /> Take a Picture
                            </ShinyButton>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
                        {generatedVideos.length > 0 && (
                            <div className="mt-12">
                                <h3 className="text-xl font-semibold mb-4 border-t border-dpa-purple/50 pt-6">My Library</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {generatedVideos.map(video => (
                                        <div key={video.id} className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group" onClick={() => { setCurrentVideoUrl(video.src); setAppState(AppState.VIEW_VIDEO); }}>
                                            <video src={video.src} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <p>View</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case AppState.SELECT_ANIMATION:
                 return (
                    <div className="w-full max-w-5xl p-8">
                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            <div className="flex flex-col items-center">
                                <h2 className="text-xl font-semibold mb-4">Your Product</h2>
                                <img src={`data:image/png;base64,${uploadedImageB64}`} alt="Uploaded product" className="rounded-2xl max-h-96 shadow-lg border-2 border-dpa-purple" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Step 1: Choose a Base Animation</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                    {ANIMATION_OPTIONS.map(opt => (
                                        <div key={opt.id} onClick={() => { setSelectedAnimation(opt); setSelectedAddOn(null); }} className={`p-3 rounded-xl cursor-pointer border-2 transition-all ${selectedAnimation?.id === opt.id ? 'border-accent-blue scale-105 shadow-lg' : 'border-gray-700 hover:border-dpa-purple'}`}>
                                            <img src={opt.thumbnailUrl} alt={opt.title} className="w-full h-24 object-cover rounded-md mb-2" />
                                            <h3 className="font-bold text-sm">{opt.title}</h3>
                                            <p className="text-xs text-gray-400">{opt.description}</p>
                                        </div>
                                    ))}
                                </div>

                                {selectedAnimation && (
                                    <>
                                        <h2 className="text-xl font-semibold mb-4">Step 2: Add an Optional Effect</h2>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                            <div onClick={() => setSelectedAddOn(null)} className={`p-3 rounded-xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center h-full ${!selectedAddOn ? 'border-accent-blue scale-105 shadow-lg' : 'border-gray-700 hover:border-dpa-purple'}`}>
                                                <h3 className="font-bold text-sm">None</h3>
                                                <p className="text-xs text-gray-400 text-center">No additional effect.</p>
                                            </div>
                                            {ANIMATION_OPTIONS.filter(opt => opt.id !== selectedAnimation.id).map(opt => (
                                                <div key={opt.id} onClick={() => setSelectedAddOn(opt)} className={`p-3 rounded-xl cursor-pointer border-2 transition-all ${selectedAddOn?.id === opt.id ? 'border-accent-blue scale-105 shadow-lg' : 'border-gray-700 hover:border-dpa-purple'}`}>
                                                    <img src={opt.thumbnailUrl} alt={opt.title} className="w-full h-24 object-cover rounded-md mb-2" />
                                                    <h3 className="font-bold text-sm">{opt.title}</h3>
                                                    <p className="text-xs text-gray-400">{opt.description}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <h2 className="text-xl font-semibold mb-4">Step 3: Select Aspect Ratio</h2>
                                        <div className="flex gap-4 mb-8">
                                            {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
                                                <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-4 py-2 rounded-lg border-2 transition-colors ${aspectRatio === ratio ? 'bg-accent-blue border-accent-blue' : 'bg-gray-700 border-gray-600 hover:border-dpa-purple'}`}>
                                                    {ratio} ({ratio === '16:9' ? 'Landscape' : 'Portrait'})
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-4">
                                            <ShinyButton onClick={resetToUpload} className="bg-gray-700 hover:bg-gray-600">Back</ShinyButton>
                                            <ShinyButton onClick={handleCreateAd} disabled={!selectedAnimation} color="orange">
                                                Create Ad
                                            </ShinyButton>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case AppState.GENERATING:
                return <Loader message={loadingMessage} />;

            case AppState.VIEW_VIDEO:
                return (
                    <div className="w-full max-w-4xl text-center p-4 sm:p-8">
                        <h2 className="text-2xl font-bold mb-6">Your Ad is Ready!</h2>
                        <video src={currentVideoUrl} controls autoPlay loop className={`rounded-2xl shadow-lg border-2 border-dpa-purple w-full ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] mx-auto max-w-sm'}`} />
                        
                        <div className="mt-8 flex flex-col items-center gap-6">
                           <div className="flex flex-col sm:flex-row gap-4 justify-center">
                             <a href={currentVideoUrl || '#'} download={`dp-artifact-ad-${Date.now()}.mp4`} className="w-full sm:w-auto">
                               <ShinyButton color="blue" className="w-full">
                                  <DownloadIcon className="w-5 h-5 mr-2" /> Download
                               </ShinyButton>
                             </a>
                             <ShinyButton onClick={resetToUpload} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600">
                                  Create Another
                             </ShinyButton>
                          </div>
                           <div className="flex flex-col items-center gap-3">
                              <p className="text-sm text-gray-400">Share with friends</p>
                              <div className="flex gap-4">
                                  <button onClick={handleShare} className="p-3 bg-gray-700 rounded-full hover:bg-accent-blue transition-colors"><FacebookIcon className="w-5 h-5" /></button>
                                  <button onClick={handleShare} className="p-3 bg-gray-700 rounded-full hover:bg-accent-blue transition-colors"><TwitterIcon className="w-5 h-5" /></button>
                                  <button onClick={handleShare} className="p-3 bg-gray-700 rounded-full hover:bg-accent-blue transition-colors"><InstagramIcon className="w-5 h-5" /></button>
                                  <button onClick={handleCopyLink} className="p-3 bg-gray-700 rounded-full hover:bg-accent-orange transition-colors"><CopyIcon className="w-5 h-5" /></button>
                                  <button onClick={handleShare} className="p-3 bg-gray-700 rounded-full hover:bg-accent-orange transition-colors"><ShareIcon className="w-5 h-5" /></button>
                              </div>
                           </div>
                        </div>
                    </div>
                );
            default:
                return <div>Something went wrong.</div>;
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 flex flex-col items-center justify-center p-4">
            <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
            <main className="flex-grow flex items-center justify-center w-full">
                {error && (
                    <div className="fixed top-24 bg-red-600/90 text-white p-4 rounded-lg shadow-lg z-50 animate-pulse" role="alert">
                        <strong>Error:</strong> {error}
                        <button onClick={() => setError(null)} className="ml-4 font-bold text-lg">&times;</button>
                    </div>
                )}
                {notification && (
                     <div className="fixed top-24 bg-blue-600/90 text-white p-4 rounded-lg shadow-lg z-50" role="status">
                        {notification}
                    </div>
                )}
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
