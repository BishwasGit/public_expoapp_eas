import * as ImagePicker from 'expo-image-picker';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/api';

const { width } = Dimensions.get('window');
const imageSize = (width - 48 - 16) / 3;

interface GalleryItem {
    id: string;
    filename: string;
    type: string;
    folder: string;
    isLocked: boolean;
    unlockPrice: number;
    url?: string;
    isUnlockedByViewer?: boolean;
}

export default function GalleryScreen({ route, navigation }: any) {
    const { user } = useContext(AuthContext);
    // params might be undefined if coming from dashboard
    const viewingPsychologistId = route.params?.psychologistId;
    const isPublicView = !!viewingPsychologistId;

    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadGallery();
    }, [viewingPsychologistId]);

    const loadGallery = async () => {
        try {
            setLoading(true);
            if (isPublicView) {
                // Public View
                const res = await apiClient.get(`/media-manager/public-gallery/${viewingPsychologistId}?viewerId=${user?.id}`);
                const files = res.data.data || res.data || [];
                setGallery(files.map((f: any) => ({ ...f, folder: 'Gallery' })));
            } else {
                // My Gallery (Private)
                const res = await apiClient.get(`/media-manager/folders`);
                const fetchedFolders = res.data.data || res.data || [];
                setFolders(fetchedFolders);

                const allFiles: GalleryItem[] = [];
                fetchedFolders.forEach((folder: any) => {
                    if (folder.files && Array.isArray(folder.files)) {
                        folder.files.forEach((file: any) => {
                            allFiles.push({
                                ...file,
                                folder: folder.name,
                            });
                        });
                    }
                });
                setGallery(allFiles);
            }
        } catch (error) {
            console.error('Failed to load gallery:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedia = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert('Permission to access camera roll is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.8,
            allowsEditing: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            uploadMedia(result.assets[0]);
        }
    };

    const uploadMedia = async (asset: ImagePicker.ImagePickerAsset) => {
        try {
            setUploading(true);
            let targetFolderId;

            if (folders.length === 0) {
                const folderRes = await apiClient.post('/media-manager/folders', { name: 'Uploads' });
                targetFolderId = folderRes.data.data?.id || folderRes.data?.id;
            } else {
                targetFolderId = folders[0].id; // Upload to first folder
            }

            if (!targetFolderId) throw new Error('No target folder');

            const formData = new FormData();
            const fileName = asset.uri.split('/').pop() || 'upload.jpg';
            const fileType = asset.mimeType || (asset.type === 'image' ? 'image/jpeg' : 'video/mp4');

            // @ts-ignore
            formData.append('files', {
                uri: asset.uri,
                name: fileName,
                type: fileType,
            });
            formData.append('isLocked', 'false');

            await apiClient.post(`/media-manager/folders/${targetFolderId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert('Success', 'Media uploaded successfully');
            loadGallery();
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Upload Failed', error.response?.data?.message || 'Failed to upload media');
        } finally {
            setUploading(false);
        }
    };

    const handleUnlock = (item: GalleryItem) => {
        Alert.alert(
            'Unlock Request',
            `Unlock this item for $${item.unlockPrice}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unlock',
                    onPress: async () => {
                        try {
                            const res = await apiClient.post(`/media-manager/files/${item.id}/unlock`);
                            if (res.data) {
                                Alert.alert('Success', 'Image unlocked!');
                                loadGallery(); // Refresh to update status
                            }
                        } catch (error: any) {
                            console.error('Unlock error:', error);
                            Alert.alert('Unlock Failed', error.response?.data?.message || 'Insufficient funds or error.');
                        }
                    }
                }
            ]
        );
    };

    const renderGalleryItem = ({ item }: { item: GalleryItem }) => {
        // Show lock overlay ONLY if locked AND NOT unlocked by viewer
        const showLock = item.isLocked && !item.isUnlockedByViewer;

        return (
            <TouchableOpacity
                style={styles.galleryItem}
                onPress={() => showLock && isPublicView ? handleUnlock(item) : null}
                activeOpacity={showLock && isPublicView ? 0.7 : 1}
            >
                <View style={styles.imagePlaceholder}>
                    <Text style={styles.imageIcon}>
                        {item.type.includes('image') ? '🖼️' : '🎬'}
                    </Text>
                    {showLock && (
                        <View style={styles.lockedOverlay}>
                            <Text style={styles.lockIcon}>🔒</Text>
                            <Text style={styles.lockPrice}>${item.unlockPrice || 0}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.folderLabel} numberOfLines={1}>
                    {item.folder}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading && !uploading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Loading gallery...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isPublicView ? 'Gallery' : 'My Gallery'}</Text>
                {!isPublicView ? (
                    <TouchableOpacity onPress={handleAddMedia} disabled={uploading}>
                        {uploading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.addText}>+ Add</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} /> // Spacer
                )}
            </View>

            {/* Stats */}
            <View style={styles.statsBar}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{gallery.length}</Text>
                    <Text style={styles.statLabel}>Items</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>
                        {gallery.filter((g) => g.type.includes('image')).length}
                    </Text>
                    <Text style={styles.statLabel}>Images</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>
                        {gallery.filter((g) => g.isLocked).length}
                    </Text>
                    <Text style={styles.statLabel}>Locked</Text>
                </View>
            </View>

            {/* Gallery Grid */}
            {gallery.length > 0 ? (
                <FlatList
                    data={gallery}
                    keyExtractor={(item) => item.id}
                    renderItem={renderGalleryItem}
                    numColumns={3}
                    contentContainerStyle={styles.galleryGrid}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🖼️</Text>
                    <Text style={styles.emptyTitle}>No media yet</Text>
                    <Text style={styles.emptyText}>
                        {isPublicView ? 'No public media available.' : 'Upload photos and videos to share with your patients'}
                    </Text>
                    {!isPublicView && (
                        <TouchableOpacity style={styles.uploadButton} onPress={handleAddMedia}>
                            <Text style={styles.uploadButtonText}>+ Upload Media</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        backgroundColor: '#7c3aed',
        paddingTop: 48,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    addText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280',
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#7c3aed',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    galleryGrid: {
        padding: 16,
    },
    galleryItem: {
        width: imageSize,
        marginRight: 8,
        marginBottom: 12,
    },
    imagePlaceholder: {
        width: imageSize,
        height: imageSize,
        backgroundColor: '#f3e8ff',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    imageIcon: {
        fontSize: 32,
    },
    lockedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockIcon: {
        fontSize: 20,
        marginBottom: 4,
        color: 'white',
    },
    lockPrice: {
        color: '#fbbf24',
        fontSize: 12,
        fontWeight: 'bold',
    },
    folderLabel: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 4,
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    emptyText: {
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    uploadButton: {
        backgroundColor: '#7c3aed',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    uploadButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});
