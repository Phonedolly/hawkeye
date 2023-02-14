import { Container, Heading } from "@chakra-ui/react";
import { appWindow, WebviewWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/tauri'
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

export default function Settings(props) {
    const [config, setConfig] = useState('');
    useEffect(() => {
        async function getConfig() {
            setConfig(await invoke('from_frontend_get_config'))
            console.log(await invoke('from_frontend_get_config'))
        }
        getConfig()
    }, [])

    return (
        <Container>
            <Heading>Settings</Heading>
            {config}
        </Container>
    )
}