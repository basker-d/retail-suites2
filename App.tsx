
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AnimationOption, GeneratedVideo, AspectRatio, User } from './types';
import { ANIMATION_OPTIONS, LOADING_MESSAGES } from './constants';
import { loginUser, registerUser, getVideos, generateVideoAd, editImage, loginWithGoogle } from './services/apiService';
import { Header } from './components/Header';
import { ShinyButton } from './components/ShinyButton';
import { Loader } from './components/Loader';
import { UploadIcon, CameraIcon, DownloadIcon, FacebookIcon, TwitterIcon, InstagramIcon, CopyIcon, ShareIcon, GoogleIcon, AppleIcon, MagicWandIcon } from './components/icons';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Logo } from './components/Logo';


// IMPORTANT: Replace with the Client ID you get from Google Cloud Console
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"; 

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const getMimeType = (file: File): string => {
    return file.type;
};

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
    
    const handleGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
        setIsLoading(true);
        setError(null);
        if (credentialResponse.credential) {
            try {
                const { token, user } = await loginWithGoogle(credentialResponse.credential);
                onAuthSuccess(token, user);
            } catch (err: any) {
                 setError(err.message || 'An error occurred during Google login.');
            } finally {
                setIsLoading(false);
            }
        } else {
            setError('Google login failed: No credential received.');
            setIsLoading(false);
        }
    };
    
    const handleGoogleLoginError = () => {
         setError('Google login failed. Please try again.');
    };


    return (
        <div className="w-full max-w-md text-center p-8 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-dpa-purple/50 shadow-lg">
            <Logo className="h-20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="mb-6 text-gray-300">{subtitle}</p>

            <div className="space-y-3">
                 <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={handleGoogleLoginError}
                        theme="filled_black"
                        text={isLogin ? "signin_with" : "signup_with"}
                        shape="rectangular"
                    />
                 </div>
                 <button onClick={() => showNotification("Apple login coming soon!")} className="w-full flex items-center justify-center gap-3 bg-black text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors border border-gray-600">
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
    const [originalImageB64, setOriginalImageB64] = useState<string | null>(null);
    const [editPrompt, setEditPrompt] = useState<string>('');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [selectedAnimation, setSelectedAnimation] = useState<AnimationOption | null>(null);
    const [selectedAddOn, setSelectedAddOn] = useState<AnimationOption | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const fetchUserLibrary = useCallback(async (authToken: string) => {
        try {
            const videos = await getVideos(authToken);
            setGeneratedVideos(videos);
        } catch (err: any) {
            setError("Could not load your video library. Please try logging in again.");
            handleLogout();
        }
    }, []);
    
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            setToken(storedToken);
            const storedUser = localStorage.getItem('user');
            if(storedUser) setUser(JSON.parse(storedUser));
            fetchUserLibrary(storedToken);
            setAppState(AppState.UPLOAD); // Go directly to upload screen
        }
    }, [fetchUserLibrary]);

    const isLoggedIn = !!token;
    
    const handleAuthSuccess = (newToken: string, newUser: User) => {
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setGeneratedVideos([]); // Clear previous user's videos
        fetchUserLibrary(newToken);
        setAppState(AppState.UPLOAD); // Go directly to upload screen
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setGeneratedVideos([]); // Clear videos on logout
        setAppState(AppState.LOGIN);
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
                setOriginalImageB64(b64);
                setAppState(AppState.CHOOSE_ACTION);
                setError(null);
            } catch (err) {
                setError("Could not process the image file.");
            }
        }
    };

    const handleImageEdit = async () => {
        if (!uploadedImageFile || !uploadedImageB64 || !editPrompt || !token) return;

        setIsEditing(true);
        setError(null);

        try {
            const mimeType = getMimeType(uploadedImageFile);
            const { imageB64: newImageB64 } = await editImage({
                imageB64: uploadedImageB64,
                imageMimeType: mimeType,
                prompt: editPrompt
            }, token);

            setUploadedImageB64(newImageB64);
            setEditPrompt('');
        } catch (err: any) {
             setError(err.message || 'An error occurred during image editing.');
        } finally {
            setIsEditing(false);
        }
    };

    const handleCreateAd = async () => {
        if (!uploadedImageFile || !uploadedImageB64 || !selectedAnimation || !token) return;
        setAppState(AppState.GENERATING);
        setError(null);
        setLoadingMessage(LOADING_MESSAGES[0]);

        let finalPrompt = selectedAnimation.prompt;
        if (selectedAddOn) {
            finalPrompt += ` Additionally, the following effect should be applied: ${selectedAddOn.description.toLowerCase()}`;
        }

        try {
            const mimeType = getMimeType(uploadedImageFile);
            
            const newVideo = await generateVideoAd({
                imageB64: uploadedImageB64,
                imageMimeType: mimeType,
                prompt: finalPrompt,
                aspectRatio: aspectRatio,
            }, token);

            setGeneratedVideos(prev => [newVideo, ...prev]);
            setCurrentVideoUrl(newVideo.src);
            setAppState(AppState.VIEW_VIDEO);

        } catch (err: any) {
            let errorMessage = err.message || "An unknown error occurred during video generation.";
            if (errorMessage.includes("401") || errorMessage.includes("denied")) {
                errorMessage = "Your session has expired. Please log in again.";
                handleLogout();
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
            if (currentVideoUrl.startsWith('data:')) {
                showNotification("Please download the video to share the file.");
            } else {
                navigator.clipboard.writeText(currentVideoUrl);
                showNotification("Link copied to clipboard!");
            }
        }
    };

    const resetToUpload = () => {
        setUploadedImageFile(null);
        setUploadedImageB64(null);
        setOriginalImageB64(null);
        setSelectedAnimation(null);
        setSelectedAddOn(null);
        setCurrentVideoUrl(null);
        setError(null);
        setEditPrompt('');
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
            
            case AppState.CHOOSE_ACTION:
                return (
                    <div className="w-full max-w-2xl text-center p-8 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-dpa-purple/50 shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">Image Uploaded!</h2>
                        <img src={`data:image/png;base64,${uploadedImageB64}`} alt="Uploaded product" className="rounded-2xl max-h-72 mx-auto mb-8 shadow-lg border-2 border-dpa-purple" />
                        <p className="mb-8 text-gray-300">What would you like to do next?</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <ShinyButton color="orange" onClick={() => setAppState(AppState.EDIT_IMAGE)}>
                                <MagicWandIcon className="w-5 h-5 mr-2" /> Edit Image
                            </ShinyButton>
                            <ShinyButton color="blue" onClick={() => setAppState(AppState.SELECT_ANIMATION)}>
                                Create Video Ad
                            </ShinyButton>
                        </div>
                        <button onClick={resetToUpload} className="mt-6 text-gray-400 hover:text-white transition-colors">
                            Or upload a different image
                        </button>
                    </div>
                );

            case AppState.EDIT_IMAGE:
                return (
                    <div className="w-full max-w-5xl p-8">
                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            <div className="flex flex-col items-center">
                                <h2 className="text-xl font-semibold mb-4">Image Preview</h2>
                                <div className="relative">
                                    {isEditing && (
                                        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center rounded-2xl z-10">
                                            <Loader message="Editing..." />
                                        </div>
                                    )}
                                    <img src={`data:image/png;base64,${uploadedImageB64}`} alt="Product to be edited" className="rounded-2xl max-h-96 shadow-lg border-2 border-dpa-purple" />
                                </div>
                                {uploadedImageB64 !== originalImageB64 && (
                                    <button onClick={() => setUploadedImageB64(originalImageB64)} className="mt-4 text-accent-orange hover:underline">
                                        Revert to Original
                                    </button>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Edit with a Prompt</h2>
                                <p className="text-gray-400 mb-4">Describe the changes you want to make. For example: "Add a retro filter", "Change the background to a beach", "Make the product look like it's made of wood".</p>
                                <textarea
                                    value={editPrompt}
                                    onChange={e => setEditPrompt(e.target.value)}
                                    placeholder="e.g., Add a soft, glowing light around the product..."
                                    className="w-full h-28 bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 mb-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none"
                                    disabled={isEditing}
                                />
                                <ShinyButton onClick={handleImageEdit} disabled={!editPrompt || isEditing} color="orange" className="w-full mb-6">
                                    {isEditing ? 'Applying Edit...' : 'Generate Edit'}
                                </ShinyButton>

                                <div className="border-t border-dpa-purple/50 pt-6 flex flex-col sm:flex-row gap-4">
                                    <ShinyButton onClick={() => setAppState(AppState.CHOOSE_ACTION)} className="bg-gray-700 hover:bg-gray-600 w-full sm:w-auto">
                                        Back
                                    </ShinyButton>
                                    <ShinyButton onClick={() => setAppState(AppState.SELECT_ANIMATION)} color="blue" className="w-full sm:w-auto">
                                        Use This Image & Create Ad
                                    </ShinyButton>
                                </div>
                            </div>
                        </div>
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
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="min-h-screen w-full bg-dpa-dark-gradient flex flex-col items-center justify-center p-4">
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
        </GoogleOAuthProvider>
    );
};

export default App;