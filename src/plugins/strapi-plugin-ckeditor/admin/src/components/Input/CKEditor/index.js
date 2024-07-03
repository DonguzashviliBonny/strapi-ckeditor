import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { Box, Loader } from '@strapi/design-system';

import {getConfiguration} from "./configuration";
import {getGlobalStyling} from "./styling";
import MediaLib from "../MediaLib";

import ckeditor5Dll from "ckeditor5/build/ckeditor5-dll.js";
import ckeditor5EditorClassicDll from "@ckeditor/ckeditor5-editor-classic/build/editor-classic.js";
import { useLocation } from "react-router-dom";


const PreviewDiv = styled.div`
background: #161616;
padding: 24px;
  h1, h2, h3, h4, h5, h6{ 
    color: #FDFDFD;
  }
    p, span{
    color: #A0A0A0;
    font-size: 16px;
    line-height: 24px;
    }

    h1{
    font-size: ${props => props.h1FontSize}px;
    line-height: ${props => props.h1LineHeight}px;
    }

    h2{
    font-size: ${props => props.h2FontSize}px;
    line-height: ${props => props.h2LineHeight}px;
    }

    h3{
    font-size: ${props => props.h3FontSize}px;
    line-height: ${props => props.h3LineHeight}px;
    }

    h4{
    font-size: ${props => props.h4FontSize}px;
    line-height: ${props => props.h4LineHeight}px;
    }

    h5{
    font-size: ${props => props.h5FontSize}px;
    line-height: ${props => props.h5LineHeight}px;
    }

    h6{
    font-size: ${props => props.h6FontSize}px;
    line-height: ${props => props.h6LineHeight}px;
    }

    p{
    font-size: ${props => props.pFontSize}px;
    line-height: ${props => props.pLineHeight}px;
    }
`


const GlobalStyling = getGlobalStyling();

const Wrapper = styled("div")`${({ editorStyles }) => editorStyles}`;

const Editor = ({ onChange, name, value, disabled, preset, maxLength }) => {
  const params = useLocation()

  console.log(params.pathname.includes('announcements'));
  console.log(window.location.href.includes(''));


  const [ editorInstance, setEditorInstance ] = useState(false);
  
  const [mediaLibVisible, setMediaLibVisible] = useState(false);
  
  const [uploadPluginConfig, setUploadPluginConfig] = useState(null);
  
  const [config, setConfig] = useState(null);

  const [lengthMax, setLengthMax] = useState(false);

  const wordCounter = useRef(null);
  
  const handleToggleMediaLib = () => setMediaLibVisible(prev => !prev);

  const handleCounter = (number) => number > maxLength ? setLengthMax(true) : setLengthMax(false);
  
  useEffect(() => {
    (async () => {
      const {currentConfig, uploadPluginConfig} = await getConfiguration(preset, handleToggleMediaLib);
      setConfig(currentConfig);
      setUploadPluginConfig(uploadPluginConfig);
    })();
  }, []);

  return (
    <>
    {config && <GlobalStyling />}
    <Wrapper editorStyles={config?.styles} >
      {!config &&
      <LoaderBox hasRadius background="neutral100">
        <Loader>Loading...</Loader>
      </LoaderBox>}
      {config &&
          <CKEditor
            editor={window.CKEditor5.editorClassic.ClassicEditor}
            config={config?.editorConfig}
            disabled={disabled}
            data={value}
            onReady={(editor) => {
              
              if(config.editorConfig.WordCountPlugin){
                const wordCountPlugin = editor.plugins.get( 'WordCount' );
                wordCountPlugin.on( 'update', ( evt, stats ) =>handleCounter(stats.characters));
                const wordCountWrapper = wordCounter.current;
                wordCountWrapper?.appendChild( wordCountPlugin.wordCountContainer );
              }

              if(editor.plugins.has( 'ImageUploadEditing' )){
                editor.plugins.get( 'ImageUploadEditing' ).on( 'uploadComplete', ( evt, { data, imageElement } ) =>    
                  editor.model.change( writer => writer.setAttribute( 'alt', data.alt, imageElement ) ) ); 
              }
            
              setEditorInstance( editor );
            }}
            onChange={(event, editor) => {
              const data = editor.getData();
              onChange({ target: { name, value: data } });
            }}
          />
      }
      {config && config.editorConfig.WordCountPlugin && 
          <CounterLoaderBox 
            color={lengthMax?"danger500":"neutral400"} 
            ref={wordCounter}>
              {!editorInstance && <Loader small>Loading...</Loader>}
          </CounterLoaderBox>
      }
      {uploadPluginConfig && <MediaLib isOpen={mediaLibVisible} onToggle={handleToggleMediaLib} editor={editorInstance} uploadConfig={uploadPluginConfig} />}
    </Wrapper>

    <PreviewDiv h1FontSize={24} h1LineHeight={32} h2FontSize={20} h2LineHeight={28} h3FontSize={16} h3LineHeight={24} dangerouslySetInnerHTML={{__html: value}}/>
    </>
  );
};

Editor.defaultProps = {
  value: "",
  disabled: false,
};

Editor.propTypes = {
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  disabled: PropTypes.bool,
};

const CounterLoaderBox = styled(Box)`
  display:flex;
  width: 100%;
  justify-content: flex-end;
  align-items: center;
  `
const LoaderBox = styled(Box)`
  display:flex;
  height: 200px;
  width: 100%;
  justify-content: center;
  align-items: center;
  `

export default Editor;
